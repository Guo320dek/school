import { useMemo } from 'react';
import type { Subject, Staff } from '../types';

/**
 * Filters staff to only those associated with the selected subject.
 * Always includes the currently editing teacher so the form doesn't break.
 */
export function useFilteredTeachers(
  allStaff: Staff[],
  subjects: Subject[],
  selectedSubjectId: string,
  editingTeacherId: string,
) {
  return useMemo(() => {
    const active = allStaff.filter((s) => s.status === '在职');
    if (!selectedSubjectId) return active;
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    if (!sub || sub.teacherIds.length === 0) return active;
    const matching = active.filter((s) => sub.teacherIds.includes(s.id));
    if (editingTeacherId && !matching.find((s) => s.id === editingTeacherId)) {
      const current = active.find((s) => s.id === editingTeacherId);
      if (current) return [current, ...matching];
    }
    return matching;
  }, [selectedSubjectId, subjects, allStaff, editingTeacherId]);
}
