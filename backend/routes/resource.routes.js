import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { createResource, getMyResources, updateResource, deleteResource } from "../controller/resource.controller.js";

const ResourceRouter = express.Router();

ResourceRouter.post("/create", isAuth, createResource);
ResourceRouter.get("/my-list", isAuth, getMyResources);
ResourceRouter.patch("/update/:id", isAuth, updateResource);
ResourceRouter.delete("/delete/:id", isAuth, deleteResource);

export default ResourceRouter;