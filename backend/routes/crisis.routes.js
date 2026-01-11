import express from "express";
import { commanderChat, reportIncident } from "../controller/crisis.controller.js";

const CrisisRouter = express.Router();

CrisisRouter.post("/chat", commanderChat);       // The Chatbot Endpoint
CrisisRouter.post("/report", reportIncident);    // The Incident Reporting Endpoint

export default CrisisRouter;