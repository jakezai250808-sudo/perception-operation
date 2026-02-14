<template>
  <div class="page-container">
    <ChartCard title="事件元数据管理（CRUD）">
      <template #actions><el-button type="primary" @click="openCreate">新增规则</el-button></template>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="150" />
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="severity" label="严重级别" width="120" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </ChartCard>

    <el-dialog v-model="visible" :title="editing ? '编辑规则' : '新增规则'" width="420px">
      <el-form label-position="top">
        <el-form-item label="ID"><el-input v-model="form.id" :disabled="editing" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type" style="width: 100%"><el-option value="trigger" label="trigger" /><el-option value="alarm" label="alarm" /></el-select></el-form-item>
        <el-form-item label="严重级别"><el-select v-model="form.severity" style="width: 100%"><el-option value="P0" label="P0" /><el-option value="P1" label="P1" /><el-option value="P2" label="P2" /><el-option value="P3" label="P3" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import ChartCard from '@/components/ChartCard.vue';
import {
  createManageRule,
  deleteManageRule,
  listManageRules,
  type EventRuleManageItem,
  updateManageRule
} from '@/api/metadata';

const list = ref<EventRuleManageItem[]>([]);
const loading = ref(false);
const visible = ref(false);
const editing = ref(false);
const form = reactive<EventRuleManageItem>({ id: '', name: '', type: 'trigger', severity: 'P1' });

const load = async () => {
  loading.value = true;
  try {
    list.value = await listManageRules();
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = false;
  Object.assign(form, { id: '', name: '', type: 'trigger', severity: 'P1' });
  visible.value = true;
};

const openEdit = (row: EventRuleManageItem) => {
  editing.value = true;
  Object.assign(form, row);
  visible.value = true;
};

const submit = async () => {
  if (editing.value) await updateManageRule(form.id, { ...form });
  else await createManageRule({ ...form });
  visible.value = false;
  await load();
};

const remove = async (id: string) => {
  await deleteManageRule(id);
  await load();
};

onMounted(load);
</script>
