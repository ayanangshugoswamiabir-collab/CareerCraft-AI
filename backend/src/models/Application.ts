import mongoose, { Document, Schema } from 'mongoose'

/* =========================================================
APPLICATION INTERFACE
========================================================= */

export interface IApplication extends Document {
userId: mongoose.Types.ObjectId
resumeId?: mongoose.Types.ObjectId

jobTitle: string
company: string

jobDescription?: string
jobUrl?: string

status:
| 'Applied'
| 'Screening'
| 'Interview'
| 'Offer'
| 'Rejected'
| 'Withdrawn'

appliedAt: Date

notes?: string

createdAt: Date
updatedAt: Date
}

/* =========================================================
APPLICATION SCHEMA
========================================================= */

const ApplicationSchema = new Schema<IApplication>(
{
/* -----------------------------------------------------
USER
----------------------------------------------------- */


userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  index: true,
},

/* -----------------------------------------------------
   RESUME USED FOR APPLICATION
   ----------------------------------------------------- */

resumeId: {
  type: Schema.Types.ObjectId,
  ref: 'Resume',
  required: false,
},

/* -----------------------------------------------------
   JOB INFORMATION
   ----------------------------------------------------- */

jobTitle: {
  type: String,
  required: true,
  trim: true,
},

company: {
  type: String,
  required: true,
  trim: true,
},

jobDescription: {
  type: String,
  default: '',
  trim: true,
},

jobUrl: {
  type: String,
  default: '',
  trim: true,
},

/* -----------------------------------------------------
   APPLICATION STATUS
   ----------------------------------------------------- */

status: {
  type: String,
  enum: [
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
  ],
  default: 'Applied',
  required: true,
},

/* -----------------------------------------------------
   APPLICATION DATE
   ----------------------------------------------------- */

appliedAt: {
  type: Date,
  default: Date.now,
  required: true,
},

/* -----------------------------------------------------
   USER NOTES
   ----------------------------------------------------- */

notes: {
  type: String,
  default: '',
  trim: true,
},


},
{
timestamps: true,
},
)

/* =========================================================
INDEXES
========================================================= */

ApplicationSchema.index({
userId: 1,
appliedAt: -1,
})

ApplicationSchema.index({
userId: 1,
status: 1,
})

/* =========================================================
MODEL
========================================================= */

const Application =
mongoose.models.Application ||
mongoose.model<IApplication>(
'Application',
ApplicationSchema,
)

export default Application
