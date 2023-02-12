#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TstPipelineStack } from '../lib/tst_pipeline-stack';

const app = new cdk.App();
new TstPipelineStack(app, 'TstPipelineStack', {});