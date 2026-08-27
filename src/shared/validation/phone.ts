import { z } from "zod";

import { localPhonePattern, phoneFormatMessage } from "./phoneFormat";

export const phoneSchema = z.string().regex(localPhonePattern, phoneFormatMessage);

export const optionalPhoneSchema = z.union([z.literal(""), phoneSchema]);
