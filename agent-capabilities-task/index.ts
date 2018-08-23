import task = require('vsts-task-lib/task');
import * as vsts from 'vso-node-api';
import { IBuildApi } from 'vso-node-api/BuildApi';
import { Build } from 'vso-node-api/interfaces/BuildInterfaces';
import { ITaskAgentApi } from 'vso-node-api/TaskAgentApi';
import { TaskAgent } from 'vso-node-api/interfaces/TaskAgentInterfaces';

async function run() {
    try {
        let token = task.getInput('personalAccessToken', true);

        let collectionUri = task.getVariable('system.teamFoundationCollectionUri');

        let authHandler = vsts.getPersonalAccessTokenHandler(token);

        let connection = new vsts.WebApi(collectionUri, authHandler);

        let projectId = task.getVariable('system.teamProjectId');
        let buildId: number = Number(task.getVariable('build.buildId'));
        let agentId = Number(task.getVariable('agent.id'));

        let systemCapabilities;

        try{
            let buildApi = await connection.getBuildApi();
            let build = await buildApi.getBuild(buildId, projectId);
            let poolId = build.queue.pool.id;
            let agentApi = await connection.getTaskAgentApi();
            let agent = await agentApi.getAgent(poolId, agentId, true);
            systemCapabilities = agent.systemCapabilities;
        }
        catch(err){
            throw new Error('Invalid personal access token');
        }

        let keys = Object.keys(systemCapabilities);

        for (let key of keys) {
            task.setVariable('agentCapabilities.' + key, systemCapabilities[key]);
        }

        task.setResult(task.TaskResult.Succeeded, 'Succeeded');
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err.message);
    }
}

run();