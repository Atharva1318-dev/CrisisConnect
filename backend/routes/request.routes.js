import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import {
    findNearestCoordinators,
    createRequest,
    updateRequestStatus,
    getCoordinatorRequests,
    getAgencyRequests
} from "../controller/request.controller.js";

const RequestRouter = express.Router();

// Logic Routes
RequestRouter.post("/nearby", isAuth, findNearestCoordinators);
RequestRouter.post("/create", isAuth, createRequest);
RequestRouter.patch("/:requestId/status", isAuth, updateRequestStatus);

// Data Fetching Routes
RequestRouter.get("/coordinator/list", isAuth, getCoordinatorRequests);
RequestRouter.get("/agency/list", isAuth, getAgencyRequests);

export default RequestRouter;