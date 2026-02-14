<template>
  <div class="page-container">
    <ChartCard title="局点管理（CRUD）">
      <template #actions><el-button type="primary" @click="openCreate">新增局点</el-button></template>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="city" label="城市" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </ChartCard>

    <el-dialog v-model="visible" :title="editing ? '编辑局点' : '新增局点'" width="420px">
      <el-form label-position="top">
        <el-form-item label="ID"><el-input v-model="form.id" :disabled="editing" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="城市"><el-input v-model="form.city" /></el-form-item>
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
import { createManageSite, deleteManageSite, listManageSites, updateManageSite, type SiteManageItem } from '@/api/metadata';

const list = ref<SiteManageItem[]>([]);
const loading = ref(false);
const visible = ref(false);
const editing = ref(false);
const form = reactive<SiteManageItem>({ id: '', name: '', city: '' });

const load = async () => {
  loading.value = true;
  try {
    list.value = await listManageSites();
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = false;
  Object.assign(form, { id: '', name: '', city: '' });
  visible.value = true;
};

const openEdit = (row: SiteManageItem) => {
  editing.value = true;
  Object.assign(form, row);
  visible.value = true;
};

const submit = async () => {
  if (editing.value) await updateManageSite(form.id, { ...form });
  else await createManageSite({ ...form });
  visible.value = false;
  await load();
};

const remove = async (id: string) => {
  await deleteManageSite(id);
  await load();
};

onMounted(load);
</script>
