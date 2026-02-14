import { defineStore } from 'pinia';
import { getRules, getSites, getVersions } from '@/api/endpoints';
import type { Rule, Site, Version } from '@/types';

export const useMetaStore = defineStore('meta', {
  state: () => ({
    sites: [] as Site[],
    versions: [] as Version[],
    rules: [] as Rule[]
  }),
  actions: {
    async bootstrap() {
      const [sites, versions, rules] = await Promise.all([getSites(), getVersions(), getRules()]);
      this.sites = sites;
      this.versions = versions;
      this.rules = rules;
    }
  }
});
