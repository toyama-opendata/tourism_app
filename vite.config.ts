import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({mode})=>({ base: process.env.BASE_PATH || loadEnv(mode,process.cwd(),'').BASE_PATH || '/', build: { sourcemap: false } }));
