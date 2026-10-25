import {describe,it,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {Action} from './TuitionWorkspace';
import {latestAttempt,nextLearningTask,parseRows,type Task,type Attempt} from './model';
const mock=vi.hoisted(()=>({rpc:vi.fn()}));vi.mock('@/integrations/supabase/client',()=>({supabase:mock}));
beforeEach(()=>{cleanup();mock.rpc.mockReset();});
const task=(id:string,position:number):Task=>({id,position,plan_id:'p',skill:id,baseline:'not_assessed',diagnostic_evidence:'Evidence recorded',instruction:'Practice the skill'});
const attempt=(id:string,outcome:string|null,task_id='a'):Attempt=>({id,outcome,task_id,submitted_at:'2026-10-20T10:00:00Z',response:'An explanation',help_requested:false,feedback:outcome?'Reviewed evidence':null,reviewed_at:null});
describe('personal tuition',()=>{
 it('prioritises reviewed support needs ahead of new work',()=>{expect(nextLearningTask([task('b',1),task('a',2)],[attempt('1','needs_support')])?.id).toBe('a');});
 it('does not suggest pending attempts or assume completion means understanding',()=>{expect(nextLearningTask([task('a',1)],[attempt('1',null)])).toBeUndefined();expect(nextLearningTask([task('a',1)],[attempt('1','independent')])).toBeUndefined();});
 it('uses stable tie ordering for latest attempts',()=>{expect(latestAttempt('a',[attempt('1','independent'),attempt('2','needs_support')])?.id).toBe('2');});
 it('rejects missing and malformed server data',()=>{expect(()=>parseRows(null,'plan')).toThrow();expect(()=>parseRows([{...task('a',1),baseline:'mastered'}],'task')).toThrow();expect(()=>parseRows([{...attempt('1',null),submitted_at:'invalid'}],'attempt')).toThrow();expect(()=>parseRows([{module_id:'a',module_title:'A',student_id:'s',student_name:'S'}],'roster')).toThrow();});
 it('freezes an uncertain request and retries the same id and values',async()=>{
  const saved=vi.fn();mock.rpc.mockResolvedValueOnce({data:null,error:new Error('offline')}).mockImplementationOnce((_n,args)=>Promise.resolve({data:args.p_id,error:null}));
  render(<Action name="add" label="Save practice" saved={saved} payload={(f,id)=>({p_id:id,skill:f.get('skill')})}><input aria-label="Skill" name="skill" defaultValue="Fractions"/></Action>);
  fireEvent.click(screen.getByText('Save practice'));await screen.findByRole('alert');expect(screen.getByLabelText('Skill')).toBeDisabled();fireEvent.click(screen.getByText('Retry unchanged request'));await waitFor(()=>expect(saved).toHaveBeenCalledOnce());expect(mock.rpc.mock.calls[1]).toEqual(mock.rpc.mock.calls[0]);
 });
 it('rejects a successful response with the wrong receipt',async()=>{const saved=vi.fn();mock.rpc.mockResolvedValue({data:'00000000-0000-4000-8000-000000000999',error:null});render(<Action name="review" label="Review" saved={saved} expected="00000000-0000-4000-8000-000000000001" payload={()=>({})}><span>Review evidence</span></Action>);fireEvent.click(screen.getByText('Review'));await screen.findByRole('alert');expect(saved).not.toHaveBeenCalled();});
 it('ignores late responses after leaving the account workspace',async()=>{let finish!:(r:unknown)=>void;mock.rpc.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));const saved=vi.fn();const view=render(<Action name="create" label="Create" saved={saved} payload={()=>({})}><span>New plan</span></Action>);fireEvent.click(screen.getByText('Create'));view.unmount();finish({data:'00000000-0000-4000-8000-000000000001',error:null});await Promise.resolve();expect(saved).not.toHaveBeenCalled();});
});
