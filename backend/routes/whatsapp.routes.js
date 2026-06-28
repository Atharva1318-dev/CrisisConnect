import express from "express";
import {
  handleIncomingWhatsAppMessage,
  getSOSStatus,
  agencyAcceptIncident,
  coordinatorDispatchResources,
  getDispatchedResources,
  getPendingIncidents,
  getActiveIncidents,
} from "../controller/whatsapp.controller.js";

const WhatsAppRouter = express.Router();

// ✅ WEBHOOK — receives ALL WhatsApp messages from WHAPI
WhatsAppRouter.post("/webhook", handleIncomingWhatsAppMessage);

// ✅ SOS STATUS — Get incident status for citizen
WhatsAppRouter.get("/incident/:incidentId/status", getSOSStatus);

// ✅ AGENCY ACCEPT — Agency accepts SOS
WhatsAppRouter.post(
  "/incident/:incidentId/agency-accept",
  agencyAcceptIncident
);

// ✅ DISPATCH RESOURCES — Coordinator dispatches resources
WhatsAppRouter.post(
  "/incident/:incidentId/dispatch-resources",
  coordinatorDispatchResources
);

// ✅ GET DISPATCHED RESOURCES — View resources for incident
WhatsAppRouter.get(
  "/incident/:incidentId/dispatched-resources",
  getDispatchedResources
);

// ✅ GET PENDING INCIDENTS — List all pending incidents
WhatsAppRouter.get("/incidents/pending", getPendingIncidents);

// ✅ GET ACTIVE INCIDENTS — List all active incidents
WhatsAppRouter.get("/incidents/active", getActiveIncidents);

export default WhatsAppRouter;