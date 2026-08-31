import mongoose from 'mongoose'

const tailoredResumeSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true,
      },

      jobDescription: {
        type: String,
        required: true,
        trim: true,
      },

      matchResult: {
        matchScore: {
          type: Number,
          default: 0,
        },

        summary: {
          type: String,
          default: '',
        },

        matchedSkills: {
          type: [String],
          default: [],
        },

        missingSkills: {
          type: [String],
          default: [],
        },

        matchedKeywords: {
          type: [String],
          default: [],
        },

        missingKeywords: {
          type: [String],
          default: [],
        },

        strengths: {
          type: [String],
          default: [],
        },

        recommendations: {
          type: [String],
          default: [],
        },
      },

      tailoredResume: {
        name: {
          type: String,
          default: '',
        },

        email: {
          type: String,
          default: '',
        },

        phone: {
          type: String,
          default: '',
        },

        location: {
          type: String,
          default: '',
        },

        headline: {
          type: String,
          default: '',
        },

        summary: {
          type: String,
          default: '',
        },

        skills: {
          type: [String],
          default: [],
        },

        education: {
          type: [String],
          default: [],
        },

        experience: {
          type: [String],
          default: [],
        },

        projects: {
          type: [String],
          default: [],
        },

        certifications: {
          type: [String],
          default: [],
        },
      },
    },

    {
      timestamps: true,
    },
  )

const TailoredResume =
  mongoose.model(
    'TailoredResume',
    tailoredResumeSchema,
  )

export default TailoredResume