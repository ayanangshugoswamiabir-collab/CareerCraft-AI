
import mongoose, {
  Document,
  Schema,
} from 'mongoose'

/*
|--------------------------------------------------------------------------
| EDUCATION
|--------------------------------------------------------------------------
*/

export interface ResumeEducation {
  degree: string
  institution: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  description: string
}

/*
|--------------------------------------------------------------------------
| EXPERIENCE
|--------------------------------------------------------------------------
*/

export interface ResumeExperience {
  jobTitle: string
  company: string
  location: string
  startDate: string
  endDate: string
  description: string
}

/*
|--------------------------------------------------------------------------
| PROJECT
|--------------------------------------------------------------------------
*/

export interface ResumeProject {
  title: string
  description: string
  technologies: string[]
}

/*
|--------------------------------------------------------------------------
| CERTIFICATION
|--------------------------------------------------------------------------
*/

export interface ResumeCertification {
  name: string
  issuer: string
  date: string
  credentialId: string
}

/*
|--------------------------------------------------------------------------
| PARSED RESUME
|--------------------------------------------------------------------------
*/

export interface ParsedResumeData {
  name: string
  email: string
  phone: string
  location: string
  headline: string
  summary: string

  skills: string[]

  education: ResumeEducation[]

  experience: ResumeExperience[]

  projects: ResumeProject[]

  certifications: ResumeCertification[]
}

/*
|--------------------------------------------------------------------------
| RESUME DOCUMENT
|--------------------------------------------------------------------------
*/

export interface IResume extends Document {
  userId: string

  fileName: string
  fileType: string
  fileSize: number

  fileData: Buffer

  extractedText: string

  parsedData: ParsedResumeData

  uploadedAt: Date
}

/*
|--------------------------------------------------------------------------
| EDUCATION SCHEMA
|--------------------------------------------------------------------------
*/

const ResumeEducationSchema =
  new Schema<ResumeEducation>(
    {
      degree: {
        type: String,
        default: '',
      },

      institution: {
        type: String,
        default: '',
      },

      fieldOfStudy: {
        type: String,
        default: '',
      },

      startDate: {
        type: String,
        default: '',
      },

      endDate: {
        type: String,
        default: '',
      },

      description: {
        type: String,
        default: '',
      },
    },
    {
      _id: false,
    },
  )

/*
|--------------------------------------------------------------------------
| EXPERIENCE SCHEMA
|--------------------------------------------------------------------------
*/

const ResumeExperienceSchema =
  new Schema<ResumeExperience>(
    {
      jobTitle: {
        type: String,
        default: '',
      },

      company: {
        type: String,
        default: '',
      },

      location: {
        type: String,
        default: '',
      },

      startDate: {
        type: String,
        default: '',
      },

      endDate: {
        type: String,
        default: '',
      },

      description: {
        type: String,
        default: '',
      },
    },
    {
      _id: false,
    },
  )

/*
|--------------------------------------------------------------------------
| PROJECT SCHEMA
|--------------------------------------------------------------------------
*/

const ResumeProjectSchema =
  new Schema<ResumeProject>(
    {
      title: {
        type: String,
        required: true,
        default: '',
      },

      description: {
        type: String,
        default: '',
      },

      technologies: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    },
  )

/*
|--------------------------------------------------------------------------
| CERTIFICATION SCHEMA
|--------------------------------------------------------------------------
*/

const ResumeCertificationSchema =
  new Schema<ResumeCertification>(
    {
      name: {
        type: String,
        required: true,
        default: '',
      },

      issuer: {
        type: String,
        default: '',
      },

      date: {
        type: String,
        default: '',
      },

      credentialId: {
        type: String,
        default: '',
      },
    },
    {
      _id: false,
    },
  )

/*
|--------------------------------------------------------------------------
| PARSED RESUME SCHEMA
|--------------------------------------------------------------------------
*/

const ParsedResumeDataSchema =
  new Schema<ParsedResumeData>(
    {
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

      /*
      |--------------------------------------------------------------------------
      | SKILLS
      |--------------------------------------------------------------------------
      */

      skills: {
        type: [String],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | EDUCATION
      |--------------------------------------------------------------------------
      */

      education: {
        type: [ResumeEducationSchema],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | EXPERIENCE
      |--------------------------------------------------------------------------
      */

      experience: {
        type: [ResumeExperienceSchema],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | PROJECTS
      |--------------------------------------------------------------------------
      */

      projects: {
        type: [ResumeProjectSchema],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | CERTIFICATIONS
      |--------------------------------------------------------------------------
      */

      certifications: {
        type: [ResumeCertificationSchema],
        default: [],
      },
    },
    {
      _id: false,
    },
  )

/*
|--------------------------------------------------------------------------
| MAIN RESUME SCHEMA
|--------------------------------------------------------------------------
*/

const ResumeSchema =
  new Schema<IResume>(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      fileName: {
        type: String,
        required: true,
      },

      fileType: {
        type: String,
        required: true,
      },

      fileSize: {
        type: Number,
        required: true,
      },

      fileData: {
        type: Buffer,
        required: true,
      },

      extractedText: {
        type: String,
        required: true,
      },

      parsedData: {
        type: ParsedResumeDataSchema,
        required: true,
        default: () => ({}),
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: false,
    },
  )

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Resume =
  mongoose.models.Resume ||
  mongoose.model<IResume>(
    'Resume',
    ResumeSchema,
  )

export default Resume
