#!/usr/bin/env node

import {startTooling} from "../tooling";

startTooling("dist", true, () => process.exit(1));
