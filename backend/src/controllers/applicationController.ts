import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Application from '../models/Application.js'
import Resume from '../models/Resume.js'

/* =========================================================
HELPERS
========================================================= */

const getUserId = (req: Request): string | undefined => {
  const user = (req as Request & {
    user?: {
      userId?: string
      id?: string
      _id?: string
      email?: string
    }
  }).user

  return user?.userId || user?.id || user?._id
}

const getApplicationId = (
req: Request,
): string | undefined => {
const value = req.params.id

if (Array.isArray(value)) {
return value[0]
}

return value
}

/* =========================================================
CREATE APPLICATION
POST /api/applications
========================================================= */

export const createApplication = async (
req: Request,
res: Response,
): Promise<void> => {
try {
const userId = getUserId(req)


if (!userId) {
  res.status(401).json({
    success: false,
    message: 'Authentication required.',
  })
  return
}

const {
  resumeId,
  jobTitle,
  company,
  jobDescription,
  jobUrl,
  status,
  appliedAt,
  notes,
} = req.body

if (
  typeof jobTitle !== 'string' ||
  !jobTitle.trim()
) {
  res.status(400).json({
    success: false,
    message: 'Job title is required.',
  })
  return
}

if (
  typeof company !== 'string' ||
  !company.trim()
) {
  res.status(400).json({
    success: false,
    message: 'Company name is required.',
  })
  return
}

if (!mongoose.Types.ObjectId.isValid(userId)) {
  res.status(400).json({
    success: false,
    message: 'Invalid user ID.',
  })
  return
}

/* -------------------------------------------------------
   OPTIONAL RESUME VALIDATION
   ------------------------------------------------------- */

if (resumeId) {
  if (
    typeof resumeId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(resumeId)
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid resume ID.',
    })
    return
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    userId,
  })

  if (!resume) {
    res.status(404).json({
      success: false,
      message:
        'Resume not found or does not belong to you.',
    })
    return
  }
}

/* -------------------------------------------------------
   VALIDATE STATUS
   ------------------------------------------------------- */

const allowedStatuses = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
]

const applicationStatus =
  typeof status === 'string' &&
  allowedStatuses.includes(status)
    ? status
    : 'Applied'

/* -------------------------------------------------------
   VALIDATE APPLICATION DATE
   ------------------------------------------------------- */

let applicationDate = new Date()

if (appliedAt) {
  const parsedDate = new Date(appliedAt)

  if (Number.isNaN(parsedDate.getTime())) {
    res.status(400).json({
      success: false,
      message: 'Invalid application date.',
    })
    return
  }

  applicationDate = parsedDate
}

/* -------------------------------------------------------
   CREATE APPLICATION
   ------------------------------------------------------- */

const application =
  await Application.create({
    userId,
    resumeId: resumeId || undefined,

    jobTitle: jobTitle.trim(),

    company: company.trim(),

    jobDescription:
      typeof jobDescription === 'string'
        ? jobDescription.trim()
        : '',

    jobUrl:
      typeof jobUrl === 'string'
        ? jobUrl.trim()
        : '',

    status: applicationStatus,

    appliedAt: applicationDate,

    notes:
      typeof notes === 'string'
        ? notes.trim()
        : '',
  })

res.status(201).json({
  success: true,
  message:
    'Application created successfully.',
  data: application,
})


} catch (error) {
console.error(
'❌ CREATE APPLICATION ERROR:',
error,
)


res.status(500).json({
  success: false,
  message:
    'Failed to create application.',
})


}
}

/* =========================================================
GET ALL APPLICATIONS
GET /api/applications
========================================================= */

export const getApplications = async (
req: Request,
res: Response,
): Promise<void> => {
try {
const userId = getUserId(req)


if (!userId) {
  res.status(401).json({
    success: false,
    message: 'Authentication required.',
  })
  return
}

if (!mongoose.Types.ObjectId.isValid(userId)) {
  res.status(400).json({
    success: false,
    message: 'Invalid user ID.',
  })
  return
}

const applications =
  await Application.find({
    userId,
  })
    .populate(
      'resumeId',
      'fileName fileType uploadedAt',
    )
    .sort({
      appliedAt: -1,
      createdAt: -1,
    })

res.status(200).json({
  success: true,
  data: applications,
})


} catch (error) {
console.error(
'❌ GET APPLICATIONS ERROR:',
error,
)


res.status(500).json({
  success: false,
  message:
    'Failed to load applications.',
})


}
}

/* =========================================================
GET SINGLE APPLICATION
GET /api/applications/:id
========================================================= */

export const getApplicationById = async (
req: Request,
res: Response,
): Promise<void> => {
try {
const userId = getUserId(req)
const id = getApplicationId(req)


if (!userId) {
  res.status(401).json({
    success: false,
    message: 'Authentication required.',
  })
  return
}

if (
  !id ||
  !mongoose.Types.ObjectId.isValid(id)
) {
  res.status(400).json({
    success: false,
    message: 'Invalid application ID.',
  })
  return
}

const application =
  await Application.findOne({
    _id: id,
    userId,
  }).populate(
    'resumeId',
    'fileName fileType uploadedAt',
  )

if (!application) {
  res.status(404).json({
    success: false,
    message: 'Application not found.',
  })
  return
}

res.status(200).json({
  success: true,
  data: application,
})


} catch (error) {
console.error(
'❌ GET APPLICATION ERROR:',
error,
)


res.status(500).json({
  success: false,
  message:
    'Failed to load application.',
})


}
}

/* =========================================================
UPDATE APPLICATION
PATCH /api/applications/:id
========================================================= */

export const updateApplication = async (
req: Request,
res: Response,
): Promise<void> => {
try {
const userId = getUserId(req)
const id = getApplicationId(req)


if (!userId) {
  res.status(401).json({
    success: false,
    message: 'Authentication required.',
  })
  return
}

if (
  !id ||
  !mongoose.Types.ObjectId.isValid(id)
) {
  res.status(400).json({
    success: false,
    message: 'Invalid application ID.',
  })
  return
}

/* -------------------------------------------------------
   BUILD UPDATE OBJECT
   ------------------------------------------------------- */

const updateData: Record<
  string,
  unknown
> = {}

const {
  resumeId,
  jobTitle,
  company,
  jobDescription,
  jobUrl,
  status,
  appliedAt,
  notes,
} = req.body

/* -------------------------------------------------------
   RESUME
   ------------------------------------------------------- */

if (resumeId !== undefined) {
  if (
    typeof resumeId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(
      resumeId,
    )
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid resume ID.',
    })
    return
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    userId,
  })

  if (!resume) {
    res.status(404).json({
      success: false,
      message:
        'Resume not found or does not belong to you.',
    })
    return
  }

  updateData.resumeId = resumeId
}

/* -------------------------------------------------------
   JOB TITLE
   ------------------------------------------------------- */

if (jobTitle !== undefined) {
  if (
    typeof jobTitle !== 'string' ||
    !jobTitle.trim()
  ) {
    res.status(400).json({
      success: false,
      message: 'Job title cannot be empty.',
    })
    return
  }

  updateData.jobTitle =
    jobTitle.trim()
}

/* -------------------------------------------------------
   COMPANY
   ------------------------------------------------------- */

if (company !== undefined) {
  if (
    typeof company !== 'string' ||
    !company.trim()
  ) {
    res.status(400).json({
      success: false,
      message: 'Company cannot be empty.',
    })
    return
  }

  updateData.company =
    company.trim()
}

/* -------------------------------------------------------
   JOB DESCRIPTION
   ------------------------------------------------------- */

if (jobDescription !== undefined) {
  updateData.jobDescription =
    typeof jobDescription === 'string'
      ? jobDescription.trim()
      : ''
}

/* -------------------------------------------------------
   JOB URL
   ------------------------------------------------------- */

if (jobUrl !== undefined) {
  updateData.jobUrl =
    typeof jobUrl === 'string'
      ? jobUrl.trim()
      : ''
}

/* -------------------------------------------------------
   STATUS
   ------------------------------------------------------- */

if (status !== undefined) {
  const allowedStatuses = [
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
  ]

  if (
    typeof status !== 'string' ||
    !allowedStatuses.includes(status)
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid application status.',
    })
    return
  }

  updateData.status = status
}

/* -------------------------------------------------------
   APPLICATION DATE
   ------------------------------------------------------- */

if (appliedAt !== undefined) {
  const parsedDate =
    new Date(appliedAt)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    res.status(400).json({
      success: false,
      message:
        'Invalid application date.',
    })
    return
  }

  updateData.appliedAt =
    parsedDate
}

/* -------------------------------------------------------
   NOTES
   ------------------------------------------------------- */

if (notes !== undefined) {
  updateData.notes =
    typeof notes === 'string'
      ? notes.trim()
      : ''
}

/* -------------------------------------------------------
   UPDATE
   ------------------------------------------------------- */

const application =
  await Application.findOneAndUpdate(
    {
      _id: id,
      userId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).populate(
    'resumeId',
    'fileName fileType uploadedAt',
  )

if (!application) {
  res.status(404).json({
    success: false,
    message: 'Application not found.',
  })
  return
}

res.status(200).json({
  success: true,
  message:
    'Application updated successfully.',
  data: application,
})


} catch (error) {
console.error(
'❌ UPDATE APPLICATION ERROR:',
error,
)


res.status(500).json({
  success: false,
  message:
    'Failed to update application.',
})


}
}

/* =========================================================
DELETE APPLICATION
DELETE /api/applications/:id
========================================================= */

export const deleteApplication = async (
req: Request,
res: Response,
): Promise<void> => {
try {
const userId = getUserId(req)
const id = getApplicationId(req)


if (!userId) {
  res.status(401).json({
    success: false,
    message: 'Authentication required.',
  })
  return
}

if (
  !id ||
  !mongoose.Types.ObjectId.isValid(id)
) {
  res.status(400).json({
    success: false,
    message: 'Invalid application ID.',
  })
  return
}

const application =
  await Application.findOneAndDelete({
    _id: id,
    userId,
  })

if (!application) {
  res.status(404).json({
    success: false,
    message: 'Application not found.',
  })
  return
}

res.status(200).json({
  success: true,
  message:
    'Application deleted successfully.',
})


} catch (error) {
console.error(
'❌ DELETE APPLICATION ERROR:',
error,
)


res.status(500).json({
  success: false,
  message:
    'Failed to delete application.',
})


}
}
