import { RiskPolicy, IRiskPolicy } from '../models/RiskPolicy';

export class RiskPolicyService {
  async getAllPolicies(): Promise<IRiskPolicy[]> {
    return RiskPolicy.find({ enabled: true }).sort({ name: 1 });
  }

  async getPolicyByName(name: string): Promise<IRiskPolicy | null> {
    return RiskPolicy.findOne({ name: name.toUpperCase() });
  }
}

export const riskPolicyService = new RiskPolicyService();
