#!/usr/bin/env node
import fs from 'node:fs/promises';
import { createMap,addIssues,completeIssue,reviewIssue,mergeIssue,cleanupIssue,finalReview,shipMap } from '../src/maps.mjs';
import { dispatch,dispatchReview,askCrew,answerCrew } from '../src/crew.mjs';
import { maps,loadMap } from '../src/store.mjs';
import { executable,harnessHome } from '../src/config.mjs';
import { Herdr } from '../src/herdr.mjs';
import {crewTodo} from '../src/crew-todo.mjs';
const [action,mapId,issueId,json]=process.argv.slice(2);
try {
  const details=json?JSON.parse(json):{};
  let result;
  switch(action){
    case 'doctor': result={home:harnessHome(),executables:Object.fromEntries(['pi','node','herdr','git','gh','claude','codex'].map(n=>[n,executable(n)]))};break;
    case 'create':result=await createMap(JSON.parse(await fs.readFile(mapId,'utf8')));break;
    case 'add-issues':result=await addIssues(mapId,JSON.parse(await fs.readFile(issueId,'utf8')));break;
    case 'list':result=await maps();break;
    case 'status':result=await loadMap(mapId);break;
    case 'dispatch':result=await dispatch(mapId,issueId,details.kind);break;
    case 'complete':result=await completeIssue(mapId,issueId,details.summary);break;
    case 'review-start':result=await dispatchReview(mapId,issueId);break;
    case 'review':result=await reviewIssue(mapId,issueId,details);break;
    case 'merge':result=await mergeIssue(mapId,issueId);break;
    case 'cleanup':result=await cleanupIssue(mapId,issueId,new Herdr());break;
    case 'final-review-start':result=await dispatchReview(mapId,null);break;
    case 'final-review':result=await finalReview(mapId,JSON.parse(issueId));break;
    case 'ship':result=await shipMap(mapId);break;
    case 'question':result=await askCrew(mapId,issueId,details.question);break;
    case 'todo':result=await crewTodo(mapId,issueId,details);break;
    case 'answer':result=await answerCrew(mapId,issueId,details.answer);break;
    default:throw new Error('Commands: doctor, create <map.json>, list, status, dispatch, complete, review-start, review, merge, cleanup, final-review-start, final-review, ship, question, answer');
  }
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
