import { Router } from 'express';
import { governanceController } from '../controllers/governance.controller';

const router = Router();

// Alerts Endpoints
router.get('/alerts', (req, res) => governanceController.getAlerts(req, res));
router.get('/alerts/portfolio/:portfolioId', (req, res) => governanceController.getAlertsByPortfolio(req, res));
router.get('/alerts/:id', (req, res) => governanceController.getAlertById(req, res));
router.post('/alerts/generate', (req, res) => governanceController.generateAlerts(req, res));
router.patch('/alerts/:id/acknowledge', (req, res) => governanceController.acknowledgeAlert(req, res));
router.patch('/alerts/:id/resolve', (req, res) => governanceController.resolveAlert(req, res));

// Audit Logs Endpoints
router.get('/audit-logs', (req, res) => governanceController.getAuditLogs(req, res));

// Risk Policies Endpoints
router.get('/risk-policies', (req, res) => governanceController.getRiskPolicies(req, res));
router.get('/risk-policies/:id', (req, res) => governanceController.getRiskPolicyById(req, res));
router.put('/risk-policies/:id', (req, res) => governanceController.updateRiskPolicy(req, res));
router.patch('/risk-policies/:id', (req, res) => governanceController.updateRiskPolicy(req, res));

export default router;
