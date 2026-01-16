import type { FlowRegistry } from "../types";

export const FLOW_REGISTRY_SEED: FlowRegistry = [
  {
    flowId: "FLOW-001",
    sopStage: "S1",
    title: "SKU Creation & Blueprint Approval",
    primaryRoles: ["Engineering", "Supervisor"],
    stateModel: "Draft → Review → Approved → Active",
    plannedEndpoints: ["/api/flows/sku/*"],
    status: "PLANNED",
  },
  {
    flowId: "FLOW-002",
    sopStage: "S4",
    title: "Batch / Work Order Creation",
    primaryRoles: ["Planner", "Supervisor"],
    stateModel: "Draft → Approved → InProgress → Closed",
    plannedEndpoints: ["/api/flows/batch/*"],
    status: "PLANNED",
  },
  {
    flowId: "FLOW-003",
    sopStage: "S3",
    title: "Inbound Receipt + Serialization + QC",
    primaryRoles: ["Stores", "QA", "Supervisor"],
    stateModel: "Received → QCPending → Released/Blocked/Scrapped",
    plannedEndpoints: ["/api/flows/inbound/*"],
    status: "PLANNED",
  },
  {
    flowId: "FLOW-004",
    sopStage: "S8/S9",
    title: "Final Pack QA → Trigger Battery ID (system)",
    primaryRoles: ["QA", "Supervisor", "System"],
    stateModel: "Pending → Approved/Rejected",
    plannedEndpoints: ["/api/flows/final-qa/*"],
    status: "PLANNED",
  },
  {
    flowId: "FLOW-005",
    sopStage: "S13/S14",
    title: "Dispatch Authorization → Execution → Custody Transfer",
    primaryRoles: ["SCM", "Finance", "Logistics"],
    stateModel: "Draft → Approved → Dispatched → Delivered → Closed",
    plannedEndpoints: ["/api/flows/dispatch/*"],
    status: "PLANNED",
  },
];