
import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string

  // Password is optional because Google users
  // authenticate through Google.
  password?: string

  // Google account information
  googleId?: string
  profilePicture?: string

  profile: {
    headline?: string
    bio?: string
    phone?: string
    location?: string
    skills: string[]
    education: string[]
    experience: string[]
  }
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false,
      minlength: 6,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    profilePicture: {
      type: String,
      default: '',
      trim: true,
    },

    profile: {
      headline: {
        type: String,
        trim: true,
        default: '',
      },

      bio: {
        type: String,
        trim: true,
        default: '',
      },

      phone: {
        type: String,
        trim: true,
        default: '',
      },

      location: {
        type: String,
        trim: true,
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
    },
  },
  {
    timestamps: true,
  },
)

const User = mongoose.model<IUser>(
  'User',
  userSchema,
)

export default User

