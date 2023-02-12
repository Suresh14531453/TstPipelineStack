import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { spawnSync } from 'child_process';
import { Construct } from 'constructs';

export class TstPipelineStack extends cdk.Stack {
  private readonly pipelineNotificationsTopic: Topic;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.pipelineNotificationsTopic = new Topic(
      this,
      "PipelineNotificationsTopic",
      {
        topicName: "PipelineNotifications",
      }
    );
    this.pipelineNotificationsTopic.addSubscription(
      new EmailSubscription("suresh.sahu@trangile.com")
    );
    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: 'pipelinestack',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true,
    })
    // const result = spawnSync('git', ['log', '--format=%H', '-n', '1']);
    // const revision = result.stdout.toString().trim().substr(0, 8);
    const cdkSourceOutput = new Artifact("CDKSourceOutput")
    pipeline.addStage({
      stageName: "source",
      actions: [
        new GitHubSourceAction({
          owner: "Suresh14531453",
          repo: "gittestfilefornewman",
          branch: "master",
          actionName: "Pipeline_Source",
          oauthToken: SecretValue.secretsManager("git_secret_key"),
          output: cdkSourceOutput
        }
        )
      ]
    })

    const cdkBuildOutput = new Artifact("CdkBuildOutPut")
    const buildStage = pipeline.addStage({
      stageName: "build",
      actions: [
        new CodeBuildAction({
          actionName: "CDK_Build",
          input: cdkSourceOutput,
          outputs: [cdkBuildOutput],
          project: new PipelineProject(this, "CdkBuildProject", {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              "build-specs/cdk-newman-build-spec.yml"
            ),
          }),
        }),

      ],
    });
    // const snsTopic = new SnsTopic(this.pipelineNotificationsTopic, {

    //   message: RuleTargetInput.fromText(
    //     `Build Test Failed `
    //   ),

    // });
    // buildStage.onStateChange("FAILED", SnsTopic, {
    //   ruleName: "Failed",
    //   eventPattern: {
    //     detail: {
    //       state: ["FAILED"],
    //     },
    //   },
    //   description: "Build Test Failed",
    // });
    // const snsTopicSuccess = new SnsTopic(this.pipelineNotificationsTopic, {
    //   message: RuleTargetInput.fromText(
    //     `Build Test Successed`
    //   ),
    // });

    // buildStage.onStateChange("SUCCEEDED", snsTopicSuccess, {
    //   ruleName: "Success",
    //   eventPattern: {
    //     detail: {
    //       state: ["SUCCEEDED"],
    //     },
    //   },
    //   description: "Build Test Successful",
    // });
    // // pipeline.addStage({
    // //   stageName: "Pipeline_Update",
    // //   actions: [
    // //     new CloudFormationCreateUpdateStackAction({
    // //       actionName: "Pipeline_Update",
    // //       stackName: "AwsCdkTestStack",
    // //       templatePath: cdkBuildOutput.atPath("TstPipelineStack.template.json"),
    // //       adminPermissions: true,
    // //     }),
    // //   ],

    // // });
  }
}
