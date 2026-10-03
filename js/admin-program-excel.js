/* Timetable export model is shared by the board and the styled Excel download. */
(function (root) {
  'use strict';
  const palette = {
    ink: 'FF17385C', white: 'FFFFFFFF', border: 'FFD5DFE8', muted: 'FF526579',
    busy: 'FFF4BBC3', busyText: 'FF741D2B', open: 'FFC9E8D5', openText: 'FF134C32',
    off: 'FFE9EEF3', offText: 'FF586779', stripe: 'FFF4F7FA'
  };
  const normalize = (value) => String(value || '').toLocaleLowerCase('tr-TR');
  const startMinute = (slot) => {
    const [h, m] = String(slot).split('-')[0].split(':').map(Number);
    return h * 60 + m;
  };
  const timeLabel = (slot) => slot.replace(/:/g, '.').replace('-', ' – ');

  function selectProgram({ teachers, entries, days, slots, filters = {} }) {
    const query = normalize(filters.query).trim();
    const matchesTeacher = (teacher) => normalize(`${teacher.name} ${teacher.phone || ''}`).includes(query);
    const matchesEntry = (entry) => normalize(`${entry.studentName} ${entry.applicationReference || ''}`).includes(query);
    const selectedTeachers = teachers.filter((teacher) => {
      if (filters.gender && teacher.gender !== filters.gender) return false;
      if (filters.teacher && teacher.id !== filters.teacher) return false;
      const assigned = entries.filter((entry) => entry.teacherId === teacher.id);
      if (filters.day && !(teacher.days || []).includes(filters.day) && !assigned.some((entry) => entry.day === filters.day)) return false;
      return !query || matchesTeacher(teacher) || assigned.some((entry) => matchesEntry(entry) &&
        (!filters.day || entry.day === filters.day) && (!filters.slot || entry.slot === filters.slot));
    }).sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'tr'));
    const teacherIds = new Set(selectedTeachers.map((teacher) => teacher.id));
    const selectedDays = filters.day ? days.filter((day) => day === filters.day) : days.slice();
    const selectedEntries = entries.filter((entry) => teacherIds.has(entry.teacherId) && selectedDays.includes(entry.day));
    const selectedSlots = filters.slot ? [filters.slot] : [...new Set([...slots, ...selectedEntries.map((entry) => entry.slot)])]
      .sort((a, b) => startMinute(a) - startMinute(b) || a.localeCompare(b));
    const visibleEntries = selectedEntries.filter((entry) => (!filters.slot || entry.slot === filters.slot) &&
      (!query || matchesTeacher(selectedTeachers.find((teacher) => teacher.id === entry.teacherId)) || matchesEntry(entry)));
    const visibleKeys = new Set(visibleEntries.map((entry) => `${entry.teacherId}|${entry.day}|${entry.slot}|${entry.applicationId}`));
    const cells = new Map();
    selectedEntries.forEach((entry) => {
      const key = `${entry.teacherId}|${entry.day}|${entry.slot}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(entry);
    });
    return {
      teachers: selectedTeachers, days: selectedDays, slots: selectedSlots, entries: visibleEntries,
      cell(teacher, day, slot) {
        const assigned = cells.get(`${teacher.id}|${day}|${slot}`) || [];
        if (assigned.length) {
          // Search-hidden lessons must never turn into apparently available green cells.
          const names = [...new Set(assigned.map((entry) => visibleKeys.has(`${entry.teacherId}|${day}|${slot}|${entry.applicationId}`)
            ? entry.studentName : 'Dolu (filtre dışı)'))];
          return { state: 'busy', text: names.join('\n'), assigned };
        }
        if (!(teacher.days || []).includes(day)) return { state: 'off', text: 'Çalışmıyor', assigned };
        if (!teacher.active) return { state: 'off', text: 'Pasif', assigned };
        return { state: 'open', text: 'Müsait', assigned };
      }
    };
  }

  function buildWorkbook(ExcelJS, model, { date, filterLabel = 'Tüm öğretmenler · Tüm hafta · Tüm saatler' } = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Birlikte İyilik Akademi';
    workbook.created = new Date();
    const style = (cell, { fill = palette.white, color = palette.ink, bold = false, size = 11, center = false } = {}) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
      cell.font = { name: 'Calibri', size, bold, color: { argb: color } };
      cell.alignment = { vertical: 'middle', horizontal: center ? 'center' : 'left', wrapText: true, indent: center ? 0 : 1 };
      cell.border = { bottom: { style: 'thin', color: { argb: palette.border } }, right: { style: 'thin', color: { argb: palette.border } } };
    };
    const statusCell = (cell, status) => {
      cell.value = status.text;
      style(cell, { fill: palette[status.state], color: palette[`${status.state}Text`], bold: true, center: status.state !== 'busy' });
    };
    const rowHeight = (values) => Math.max(36, ...values.map((value) => String(value || '').split('\n')
      .reduce((lines, line) => lines + Math.max(1, Math.ceil(line.length / 24)), 0) * 14 + 12));
    const createSheet = (name, heading, columns) => {
      const sheet = workbook.addWorksheet(name, { properties: { defaultRowHeight: 36 }, views: [{ showGridLines: false }] });
      sheet.columns = columns.map((width) => ({ width }));
      sheet.mergeCells(1, 1, 1, columns.length);
      sheet.getCell(1, 1).value = heading;
      style(sheet.getCell(1, 1), { fill: palette.ink, color: palette.white, bold: true, size: 19 });
      sheet.getRow(1).height = 44;
      sheet.mergeCells(2, 1, 2, columns.length);
      sheet.getCell(2, 1).value = `BİRLİKTE İYİLİK AKADEMİ · Yüz yüze eğitim · ${date || ''}\n${filterLabel}`;
      style(sheet.getCell(2, 1), { color: palette.muted, size: 10 });
      const lineCapacity = Math.max(24, columns.reduce((sum, width) => sum + width, 0) - 4);
      sheet.getRow(2).height = Math.max(38, sheet.getCell(2, 1).value.split('\n')
        .reduce((lines, line) => lines + Math.ceil(line.length / lineCapacity), 0) * 13 + 10);
      ['open', 'busy', 'off'].slice(0, columns.length).forEach((state, index) => statusCell(sheet.getCell(3, index + 1), {
        state, text: { open: 'Müsait saat', busy: 'Dolu ders saati', off: 'Çalışmıyor / Pasif' }[state]
      }));
      sheet.getRow(3).height = 30;
      sheet.getRow(4).height = 12;
      sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 } };
      sheet.headerFooter = { oddFooter: '&LBirlikte İyilik Akademi&R&P / &N' };
      return sheet;
    };
    const headingRow = (sheet, index, values) => {
      const row = sheet.getRow(index);
      values.forEach((value, col) => {
        row.getCell(col + 1).value = value;
        style(row.getCell(col + 1), { fill: palette.ink, color: palette.white, bold: true, center: true });
      });
      row.height = 30;
    };
    const general = createSheet('Genel Ders Programı', 'YÜZ YÜZE GENEL DERS TABLOSU', [21, ...model.teachers.map(() => 34)]);
    // Match the reference: one teacher per column, working days immediately below the name.
    const teacherDays = new Map(model.teachers.map((teacher) => [teacher.id, model.days.filter((day) =>
      (teacher.days || []).includes(day.id) || model.slots.some((slot) => model.cell(teacher, day.id, slot).state === 'busy'))]));
    headingRow(general, 5, ['Hocalar', ...model.teachers.map((teacher) => teacher.name)]);
    general.getRow(5).height = Math.max(42, ...model.teachers.map((teacher) => Math.ceil(teacher.name.length / 26) * 15 + 12));
    headingRow(general, 6, ['Gün / Saat', ...model.teachers.map((teacher) =>
      `${teacher.active ? '' : 'Pasif\n'}${teacherDays.get(teacher.id).map((day) => day.label).join(' · ') || 'Çalışma günü yok'}`)]);
    general.getRow(6).eachCell((cell) => style(cell, { fill: palette.stripe, color: palette.muted, bold: true, size: 10, center: true }));
    general.getRow(6).height = Math.max(36, ...general.getRow(6).values.slice(1).map((value) =>
      String(value).split('\n').reduce((lines, line) => lines + Math.ceil(line.length / 32), 0) * 13 + 12));
    general.views = [{ state: 'frozen', xSplit: 1, ySplit: 6, showGridLines: false, topLeftCell: 'B7' }];
    general.pageSetup.printTitlesRow = '1:6';
    const shortDay = { pazartesi: 'Pzt', sali: 'Sal', carsamba: 'Çar', persembe: 'Per', cuma: 'Cum' };
    const generalCell = (teacher, slot) => {
      const days = teacherDays.get(teacher.id);
      const students = new Map();
      const available = [];
      days.forEach((day) => {
        const cell = model.cell(teacher, day.id, slot);
        if (cell.state === 'open') available.push(shortDay[day.id] || day.label);
        if (cell.state !== 'busy') return;
        cell.text.split('\n').forEach((name) => {
          if (!students.has(name)) students.set(name, []);
          students.get(name).push(shortDay[day.id] || day.label);
        });
      });
      if (students.size) {
        const lines = [...students].map(([name, studentDays]) => students.size === 1 && studentDays.length === days.length
          ? name : `${name}\n${studentDays.join(' · ')}`);
        if (available.length) lines.push(`Müsait: ${available.join(' · ')}`);
        return { state: 'busy', text: lines.join('\n') };
      }
      return available.length ? { state: 'open', text: 'Müsait' } : { state: 'off', text: teacher.active ? 'Çalışmıyor' : 'Pasif' };
    };
    let rowIndex = 7;
    model.slots.forEach((slot, slotIndex) => {
      const row = general.getRow(rowIndex++);
      row.getCell(1).value = timeLabel(slot);
      style(row.getCell(1), { fill: slotIndex % 2 ? palette.stripe : palette.white, bold: true, center: true });
      model.teachers.forEach((teacher, index) => statusCell(row.getCell(index + 2), generalCell(teacher, slot)));
      row.height = Math.max(48, rowHeight(row.values.slice(1)));
    });
    general.pageSetup.printArea = `A1:${general.getColumn(model.teachers.length + 1).letter}${rowIndex - 1}`;

    const individual = createSheet('Öğretmen Programları', 'ÖĞRETMENLERE ÖZEL PROGRAMLAR', [21, ...model.days.map(() => 32)]);
    rowIndex = 5;
    model.teachers.forEach((teacher, index) => {
      if (index) individual.getRow(rowIndex++).height = 16;
      const teacherTitleRow = rowIndex;
      individual.mergeCells(rowIndex, 1, rowIndex, model.days.length + 1);
      const title = individual.getCell(rowIndex++, 1);
      title.value = `${teacher.name} · ${teacher.active ? 'Aktif' : 'Pasif'}`;
      style(title, { fill: palette.ink, color: palette.white, bold: true, size: 14 });
      individual.getRow(teacherTitleRow).height = 32;
      headingRow(individual, rowIndex++, ['Saat', ...model.days.map((day) => day.label)]);
      model.slots.forEach((slot) => {
        const row = individual.getRow(rowIndex++);
        row.getCell(1).value = timeLabel(slot);
        style(row.getCell(1), { fill: palette.stripe, bold: true, center: true });
        model.days.forEach((day, col) => statusCell(row.getCell(col + 2), model.cell(teacher, day.id, slot)));
        row.height = rowHeight(row.values.slice(1));
      });
      if (index) individual.getRow(teacherTitleRow - 1).addPageBreak();
    });
    individual.views = [{ state: 'frozen', xSplit: 1, ySplit: 4, showGridLines: false }];
    individual.pageSetup.printArea = `A1:${individual.getColumn(model.days.length + 1).letter}${rowIndex - 1}`;
    return workbook;
  }
  root.BIAProgramExcel = { selectProgram, buildWorkbook, palette };
})(typeof window !== 'undefined' ? window : globalThis);
