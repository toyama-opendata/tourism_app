import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { App } from '../src/App';
import * as collection from '../src/lib/collection';
const data=JSON.parse(readFileSync('public/data/spots.json','utf8'));
beforeEach(()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>data})));
  vi.stubGlobal('scrollTo',vi.fn());
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  vi.spyOn(collection,'sendEvent').mockResolvedValue('requested');
  vi.stubEnv('VITE_GAS_ENDPOINT','');
  localStorage.clear();
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();});
async function completeQuestions(user:ReturnType<typeof userEvent.setup>){
  await user.click(screen.getByRole('button',{name:/旅タイプを診断する/}));
  for(let i=0;i<4;i++){
    for(const radio of screen.getAllByRole('radio',{name:'とてもそう思う'})) await user.click(radio);
    await user.click(screen.getByRole('button',{name:i===3?/最後のステップへ/:/次のページへ/}));
  }
}
test('full 16-question flow, optional skip, result, privacy return and restart without transmission',async()=>{
  const user=userEvent.setup();render(<App/>);
  await completeQuestions(user);
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  await user.click(screen.getByRole('button',{name:'属性入力をスキップして結果を見る'}));
  await screen.findByRole('heading',{name:'山岳の美食家'});
  expect(screen.getAllByRole('link',{name:/の公式案内を見る/}).length).toBe(6);
  expect(collection.sendEvent).not.toHaveBeenCalled();expect(localStorage.length).toBe(0);
  await user.click(screen.getByRole('button',{name:'データの取り扱い'}));
  await user.click(screen.getByRole('button',{name:'戻る'}));
  expect(screen.getByRole('heading',{name:'山岳の美食家'})).toBeTruthy();
  await user.click(screen.getByRole('button',{name:/もう一度診断する/}));
  expect(screen.getAllByRole('radio').every(r=>!(r as HTMLInputElement).checked)).toBe(true);
});
test('back retains answers, consent sends once, zero codes preserved, revoke stops subsequent tracking',async()=>{
  vi.stubEnv('VITE_GAS_ENDPOINT','https://script.google.com/macros/s/test/exec');
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:/旅タイプを診断する/}));
  for(const radio of screen.getAllByRole('radio',{name:'ややそう思う'})) await user.click(radio);
  await user.click(screen.getByRole('button',{name:/次のページへ/}));
  await user.click(screen.getByRole('button',{name:/前のページ/}));
  expect((screen.getAllByRole('radio',{name:'ややそう思う'})[0] as HTMLInputElement).checked).toBe(true);
  for(let i=0;i<4;i++){for(const radio of screen.getAllByRole('radio',{name:'とてもそう思う'})) await user.click(radio);await user.click(screen.getByRole('button',{name:i===3?/最後のステップへ/:/次のページへ/}));}
  await user.selectOptions(screen.getByLabelText('年代'),'0');
  await user.selectOptions(screen.getByLabelText('今回の旅で想定する同行者'),'0');
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button',{name:/^診断結果を見る/}));
  await waitFor(()=>expect(collection.sendEvent).toHaveBeenCalledTimes(1));
  const payload=vi.mocked(collection.sendEvent).mock.calls[0][0];
  expect(payload.attributes.age).toBe(0);expect(payload.attributes.companion).toBe(0);
  expect(payload.recommended_spot_ids.length).toBe(6);expect(payload.type).toBe('NAGM');
  await user.click(screen.getAllByRole('link',{name:/の公式案内を見る/})[0]);
  expect(collection.sendEvent).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole('button',{name:'今後のリンククリック送信を止める'}));
  expect(screen.getByText('今後のリンククリック送信を停止しました。')).toBeTruthy();
  await user.click(screen.getAllByRole('link',{name:/の公式案内を見る/})[1]);
  expect(collection.sendEvent).toHaveBeenCalledTimes(2);
});

test('four questions per page, incomplete answers prevent advancing, progress counts answers',async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:/旅タイプを診断する/}));
  expect(screen.getAllByRole('group')).toHaveLength(4);
  const next=screen.getByRole('button',{name:/次のページへ/}) as HTMLButtonElement;
  expect(next.disabled).toBe(true);
  const radios=screen.getAllByRole('radio',{name:'とてもそう思う'});
  for(const radio of radios.slice(0,3)) await user.click(radio);
  expect(next.disabled).toBe(true);
  expect(screen.getByRole('progressbar').getAttribute('value')).toBe('3');
  await user.click(radios[3]);expect(next.disabled).toBe(false);
  await user.click(next);
  expect(screen.getAllByRole('radio').every(r=>!(r as HTMLInputElement).checked)).toBe(true);
});
