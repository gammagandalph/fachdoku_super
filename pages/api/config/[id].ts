import { NextApiRequest, NextApiResponse } from "next";
import { Response } from "express";
import { backendConfig } from "@/config/backendConfig";
import supertokens from "supertokens-node/lib/build/supertokens";
import { Configuration } from "@prisma/client";
import { superTokensNextWrapper } from "supertokens-node/nextjs";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { SessionRequest } from "supertokens-node/framework/express";
import { prisma } from "@/db/prisma";
import { logger } from "@/config/logger";

supertokens.init(backendConfig());

export interface ISetting {
  setting?: Configuration;
  error?: "METHOD_NOT_ALLOWED" | "INTERNAL_SERVER_ERROR";
}

export default async function config(
  req: NextApiRequest & SessionRequest,
  res: NextApiResponse & Response
) {
  await superTokensNextWrapper(
    async (next) => {
      return await verifySession()(req, res, next);
    },
    req,
    res
  );

  const { id } = req.query;

  const reqUser = await prisma.user
    .findUnique({
      where: { authId: req.session.getUserId() },
    })
    .catch((err) => logger.error(err));

  if (!reqUser) return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  if (reqUser.role !== "ADMIN") res.status(403).json({ error: "FORBIDDEN" });

  switch (req.method) {
    case "GET":
      const config = await prisma.configuration
        .findUnique({ where: { id: id as string } })
        .catch((err) => {
          logger.error(err);
          return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        });

      return res.status(200).json({ config });
    case "POST":
      await prisma.configuration
        .update({
          where: { id: id as string },
          data: req.body,
        })
        .catch((err) => {
          logger.error(err);
          return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        });
      return res.status(200).json({ config });
    case "DELETE":
      await prisma.configuration
        .delete({
          where: { id: id as string },
        })
        .catch((err) => {
          logger.error(err);
          return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        });
      return res.status(200).json({ config });
    default:
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
}

