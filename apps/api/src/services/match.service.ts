import OpenAI from 'openai';
import { prisma } from '../config/prisma.js';
import { config } from '../config/env.js';

export interface MatchResult {
  jobId: string;
  candidateId: string;
  score: number; // 0 to 100
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
  job?: any;
  candidate?: any;
}

export class MatchService {
  private static openaiClient: OpenAI | null = null;

  private static getOpenAI(): OpenAI | null {
    if (!this.openaiClient && config.openaiApiKey) {
      this.openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
    }
    return this.openaiClient;
  }

  /**
   * Compute cosine similarity between two numeric vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Deterministic local embedding fallback (256-dimension normalized vector)
   */
  static localSemanticEmbedding(text: string): number[] {
    const dim = 256;
    const vector = new Array(dim).fill(0);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 31 + word.charCodeAt(j)) & 0xffffffff;
      }
      const index = Math.abs(hash) % dim;
      vector[index] += 1;

      // Bigram features
      if (i > 0) {
        const bigram = `${words[i - 1]}_${word}`;
        let biHash = 0;
        for (let j = 0; j < bigram.length; j++) {
          biHash = (biHash * 37 + bigram.charCodeAt(j)) & 0xffffffff;
        }
        vector[Math.abs(biHash) % dim] += 1.5;
      }
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return vector.map((v) => v / norm);
    }
    return vector;
  }

  /**
   * Generate text embedding using OpenAI text-embedding-3-small or local fallback
   */
  static async getEmbedding(text: string): Promise<number[]> {
    const openai = this.getOpenAI();
    if (openai) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000),
        });
        return response.data[0].embedding;
      } catch (err) {
        console.warn('[MatchService] OpenAI embedding failed, using local semantic fallback:', err);
      }
    }

    return this.localSemanticEmbedding(text);
  }

  /**
   * Generate an explainable match reason chip
   */
  static generateMatchReason(
    score: number,
    matchedSkills: string[],
    missingSkills: string[],
    jobTitle: string
  ): string {
    if (matchedSkills.length > 0) {
      const topSkills = matchedSkills.slice(0, 3).join(', ');
      if (score >= 85) {
        return `Strong ${topSkills} skills match; ideal fit for ${jobTitle}`;
      } else if (score >= 70) {
        return `Solid ${topSkills} background; aligns with key requirements`;
      } else {
        return `Relevant proficiency in ${topSkills}`;
      }
    }

    if (score >= 80) {
      return `High overall profile synergy with ${jobTitle} responsibilities`;
    } else if (missingSkills.length > 0) {
      return `Potential match; could expand into ${missingSkills.slice(0, 2).join(', ')}`;
    }
    return `Baseline qualifications met for ${jobTitle}`;
  }

  /**
   * Score all active jobs for a given candidate profile and return top matches
   */
  static async matchJobsForCandidate(candidateId: string, limit = 10) {
    // 1. Get Candidate Profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    if (!profile) {
      return [];
    }

    // 2. Build candidate textual representation
    const candidateText = [
      profile.fullName,
      profile.headline || '',
      profile.bio || '',
      `Skills: ${profile.skills.join(', ')}`,
      profile.experience ? `Experience: ${JSON.stringify(profile.experience)}` : '',
      profile.education ? `Education: ${JSON.stringify(profile.education)}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const candidateEmbedding = await this.getEmbedding(candidateText);

    // 3. Get all active / published jobs
    const activeJobs = await prisma.job.findMany({
      where: {
        status: { in: ['ACTIVE', 'PUBLISHED', 'active'] },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            location: true,
            industry: true,
          },
        },
      },
    });

    if (activeJobs.length === 0) {
      return [];
    }

    // 4. Score each job
    const candidateSkillsLower = profile.skills.map((s) => s.toLowerCase());
    const scoredJobs: MatchResult[] = [];

    for (const job of activeJobs) {
      const jobText = [
        job.title,
        job.department || '',
        job.location || '',
        `Requirements: ${job.requirements.join(', ')}`,
        job.description,
      ].join(' ');

      const jobEmbedding = await this.getEmbedding(jobText);
      const rawSim = this.cosineSimilarity(candidateEmbedding, jobEmbedding);

      // Identify matched and missing skills
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const req of job.requirements) {
        const reqLower = req.toLowerCase();
        if (candidateSkillsLower.some((cs) => cs.includes(reqLower) || reqLower.includes(cs))) {
          matchedSkills.push(req);
        } else {
          missingSkills.push(req);
        }
      }

      // Compute normalized score 50 - 98%
      const skillBonus = job.requirements.length > 0 ? (matchedSkills.length / job.requirements.length) * 35 : 15;
      const normalizedScore = Math.min(
        99,
        Math.max(12, Math.round(rawSim * 45 + skillBonus + (matchedSkills.length > 0 ? 15 : 0)))
      );

      const reason = this.generateMatchReason(normalizedScore, matchedSkills, missingSkills, job.title);

      // Save to JobMatch table in PostgreSQL
      await prisma.jobMatch.upsert({
        where: {
          jobId_candidateId: {
            jobId: job.id,
            candidateId,
          },
        },
        create: {
          jobId: job.id,
          candidateId,
          score: normalizedScore,
          reason,
          matchedSkills,
          missingSkills,
        },
        update: {
          score: normalizedScore,
          reason,
          matchedSkills,
          missingSkills,
        },
      });

      scoredJobs.push({
        jobId: job.id,
        candidateId,
        score: normalizedScore,
        reason,
        matchedSkills,
        missingSkills,
        job,
      });
    }

    // Return top N sorted by score descending
    scoredJobs.sort((a, b) => b.score - a.score);
    return scoredJobs.slice(0, limit);
  }

  /**
   * Score all candidate profiles for a given job and return top matches (Recruiter view)
   */
  static async matchCandidatesForJob(jobId: string, limit = 10) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        organization: true,
      },
    });

    if (!job) {
      throw new Error('Job listing not found');
    }

    const jobText = [
      job.title,
      job.department || '',
      job.location || '',
      `Requirements: ${job.requirements.join(', ')}`,
      job.description,
    ].join(' ');

    const jobEmbedding = await this.getEmbedding(jobText);
    const jobReqsLower = job.requirements.map((r) => r.toLowerCase());

    // Fetch all candidates with profile
    const candidates = await prisma.candidateProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (candidates.length === 0) {
      return [];
    }

    const scoredCandidates: MatchResult[] = [];

    for (const cand of candidates) {
      const candText = [
        cand.fullName,
        cand.headline || '',
        cand.bio || '',
        `Skills: ${cand.skills.join(', ')}`,
        cand.experience ? `Experience: ${JSON.stringify(cand.experience)}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const candEmbedding = await this.getEmbedding(candText);
      const rawSim = this.cosineSimilarity(jobEmbedding, candEmbedding);

      const candSkillsLower = cand.skills.map((s) => s.toLowerCase());
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const req of job.requirements) {
        const reqLower = req.toLowerCase();
        if (candSkillsLower.some((cs) => cs.includes(reqLower) || reqLower.includes(cs))) {
          matchedSkills.push(req);
        } else {
          missingSkills.push(req);
        }
      }

      const skillBonus = job.requirements.length > 0 ? (matchedSkills.length / job.requirements.length) * 35 : 15;
      const normalizedScore = Math.min(
        99,
        Math.max(12, Math.round(rawSim * 45 + skillBonus + (matchedSkills.length > 0 ? 15 : 0)))
      );

      const reason = this.generateMatchReason(normalizedScore, matchedSkills, missingSkills, job.title);

      await prisma.jobMatch.upsert({
        where: {
          jobId_candidateId: {
            jobId: job.id,
            candidateId: cand.userId,
          },
        },
        create: {
          jobId: job.id,
          candidateId: cand.userId,
          score: normalizedScore,
          reason,
          matchedSkills,
          missingSkills,
        },
        update: {
          score: normalizedScore,
          reason,
          matchedSkills,
          missingSkills,
        },
      });

      scoredCandidates.push({
        jobId: job.id,
        candidateId: cand.userId,
        score: normalizedScore,
        reason,
        matchedSkills,
        missingSkills,
        candidate: {
          id: cand.id,
          userId: cand.userId,
          fullName: cand.fullName,
          headline: cand.headline,
          location: cand.location,
          avatarUrl: cand.avatarUrl,
          resumeUrl: cand.resumeUrl,
          skills: cand.skills,
          experience: cand.experience,
          education: cand.education,
        },
      });
    }

    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates.slice(0, limit);
  }

  /**
   * Get previously computed matches for candidate
   */
  static async getCandidateMatches(candidateId: string, limit = 10) {
    const matches = await prisma.jobMatch.findMany({
      where: { candidateId },
      include: {
        job: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                location: true,
                industry: true,
              },
            },
          },
        },
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    if (matches.length === 0) {
      // Auto-compute on first access if active jobs exist
      return this.matchJobsForCandidate(candidateId, limit);
    }

    return matches;
  }
}
