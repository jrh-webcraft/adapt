#!/usr/bin/env node

import setup from './setup.js'
import { resolve } from 'path'

// --------------------------------------------

setup(resolve(process.cwd(), process.argv[2]))
