import { Router } from 'express'
import { analyzeJD } from '../controllers/jdController.js'

const router = Router()

router.post('/analyze', analyzeJD)

export default router