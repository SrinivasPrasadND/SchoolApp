// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { makeStore } from '@/app/store';
import { api } from '@/services/api/endpoints';
import { setCredentials } from '@/features/auth/authSlice';

async function authedAdminStore() {
  const store = makeStore();
  const login = await store.dispatch(
    api.endpoints.login.initiate({ identifier: 'admin@school.edu', password: 'password123' }),
  );
  if ('data' in login && login.data) store.dispatch(setCredentials(login.data));
  return store;
}

describe('admin user management workflow', () => {
  it('creates a parent and a linked student', async () => {
    const store = await authedAdminStore();

    const parent = await store.dispatch(
      api.endpoints.createParent.initiate({ name: 'New Parent', email: `p${Date.now()}@school.edu` }),
    );
    expect('data' in parent).toBe(true);
    if (!('data' in parent) || !parent.data) return;

    const classes = await store.dispatch(api.endpoints.getClasses.initiate());
    const classId = 'data' in classes && classes.data ? classes.data[0].id : 'cls_5';
    const section = 'data' in classes && classes.data ? classes.data[0].sections[0] : 'A';

    const student = await store.dispatch(
      api.endpoints.createStudent.initiate({
        name: 'New Student',
        rollNumber: 'NS-01',
        classId,
        section,
        parentId: parent.data.id,
        gender: 'male',
        dateOfBirth: '2015-01-01',
        guardianName: 'New Parent',
        contactPhone: '+1 555 9999',
        admissionDate: '2026-01-01',
      }),
    );
    expect('data' in student).toBe(true);
    if ('data' in student && student.data) {
      expect(student.data.name).toBe('New Student');
      expect(student.data.parentId).toBe(parent.data.id);
    }
  });

  it('rejects a duplicate parent email', async () => {
    const store = await authedAdminStore();
    const result = await store.dispatch(
      api.endpoints.createParent.initiate({ name: 'Dup', email: 'parent@school.edu' }),
    );
    expect('error' in result).toBe(true);
  });
});
