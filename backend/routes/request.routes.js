import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { findNearestCoordinators, createRequest, updateRequestStatus } from "../controller/request.controller.js";

const RequestRouter = express.Router();

RequestRouter.post("/nearby", isAuth, findNearestCoordinators);
RequestRouter.post("/create", isAuth, createRequest);
RequestRouter.patch("/:requestId/status", isAuth, updateRequestStatus);

export default RequestRouter;