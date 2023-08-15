import { SessionRequest } from "supertokens-node/framework/express";
import supertokens from "supertokens-node/lib/build/supertokens";
import { superTokensNextWrapper } from "supertokens-node/nextjs";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import UserRoles from "supertokens-node/recipe/userroles";
import { backendConfig } from "@/config/backendConfig";
import { prisma } from "@/db/prisma";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import { logger as _logger } from "@/config/logger";

supertokens.init(backendConfig());

export interface ICreateAdminUser {
  error?: "INTERNAL_SERVER_ERROR";
}

export default async function createAdminUser(req: SessionRequest, res: any) {
  const logger = _logger.child({
    endpoint: `/user/createAdminUser`,
    method: req.method,
    query: req.query,
    cookie: req.headers.cookie,
  });

  await superTokensNextWrapper(
    async (next) => {
      await verifySession({
        overrideGlobalClaimValidators: async function (globalClaimValidators) {
          return [
            ...globalClaimValidators,
            UserRoles.UserRoleClaim.validators.includes("admin"),
          ];
        },
      })(req, res, next);
    },
    req,
    res
  );

  logger.info({ session: req.session }, "access to /api/user/createAdminUser");

  const session = req.session;
  const authId = session.getUserId();
  let userInfo = await EmailPassword.getUserById(authId);

  const user = await prisma.user
    .create({
      data: { authId: authId, email: userInfo.email, role: "ADMIN" },
    })
    .catch((err) => logger.error(err));

  if (!user) return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });

  return res.status(200).json({ user });
}

