// Events live in the same encrypted archive/write as the change they describe.
// This avoids partial two-archive updates and includes them in existing backups.
function event(type, actor, at, details = {}) {
  return { id: crypto.randomUUID(), type, actor, at, ...details };
}

export function placementSnapshot(placement) {
  if (!placement) return null;
  const days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
  return {
    teacherId: placement.teacherId || '', teacherName: placement.teacherName || '',
    startDate: placement.startDate || '',
    schedule: (placement.schedule || []).map(({ day, slot, teacherId, teacherName }) =>
      ({ day, slot, teacherId, teacherName: teacherName || '' }))
      .sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.slot.localeCompare(b.slot))
  };
}

export function trackApplicationChanges(before, after, { planning, actor = 'Sistem', at = new Date().toISOString() } = {}) {
  const previous = new Map(before.map((item) => [item.id, item]));
  if (!planning) {
    for (const item of after) {
      const old = previous.get(item.id);
      const history = [...(old?.history || [])];
      if (!old) history.push(event(item.isDemo ? 'demo-created' : 'application-created', actor, item.createdAt || at));
      else {
        if (old.status !== item.status) history.push(event('status-changed', actor, at, { before: old.status, after: item.status }));
        if ((old.adminNote || '') !== (item.adminNote || '')) history.push(event('admin-note-changed', actor, at, { before: old.adminNote || '', after: item.adminNote || '' }));
        if (Boolean(old.guardianMessageSent) !== Boolean(item.guardianMessageSent)) history.push(event('guardian-message-marked', actor, at, { sent: Boolean(item.guardianMessageSent) }));
        if (Boolean(old.warningMessageSentAt) !== Boolean(item.warningMessageSentAt)) history.push(event('warning-message-marked', actor, at, { sent: Boolean(item.warningMessageSentAt) }));
      }
      if (history.length) item.history = history;
    }
    return after;
  }
  const oldPlacements = new Map(before.filter((item) => item.kind === 'placement').map((item) => [item.applicationId, item]));
  const newPlacements = new Map(after.filter((item) => item.kind === 'placement').map((item) => [item.applicationId, item]));
  for (const id of new Set([...oldPlacements.keys(), ...newPlacements.keys()])) {
    const old = oldPlacements.get(id), current = newPlacements.get(id);
    const oldState = placementSnapshot(old), newState = placementSnapshot(current);
    if (JSON.stringify(oldState) === JSON.stringify(newState)) continue;
    // Older archives did not keep an event log. Preserve only their known latest
    // snapshot, explicitly labelled as such, not a fabricated original assignment.
    if (old && !after.some((item) => item.kind === 'application-event' && item.applicationId === id)) {
      after.push({ kind: 'application-event', applicationId: id, ...event('legacy-placement', old.updatedBy || 'Eski kayıt', old.updatedAt || old.createdAt || '', { after: oldState, legacy: true }) });
    }
    after.push({ kind: 'application-event', applicationId: id,
      ...event(!old ? 'placement-created' : !current ? 'placement-removed' : 'placement-changed', actor, at,
        { before: oldState, after: newState }) });
  }
  return after;
}

export function applicationHistory(application, planning) {
  const history = [...(application.history || []), ...planning.filter((item) =>
    item.kind === 'application-event' && item.applicationId === application.id)];
  if (!history.some((item) => ['application-created', 'demo-created'].includes(item.type))) {
    history.push({ id: `created:${application.id}`, type: 'application-created', at: application.createdAt, actor: 'Başvuru kaydı', legacy: true });
  }
  const placement = planning.find((item) => item.kind === 'placement' && item.applicationId === application.id);
  if (placement && !history.some((item) => item.type.startsWith('placement-') || item.type === 'legacy-placement')) {
    history.push({ id: `placement:${placement.id}`, type: 'legacy-placement', at: placement.updatedAt || placement.createdAt,
      actor: placement.updatedBy || 'Eski kayıt', after: placementSnapshot(placement), legacy: true });
  }
  return history.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
