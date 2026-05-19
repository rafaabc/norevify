import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReminderTypeSelect from '../components/ReminderTypeSelect.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { remindersApi } from '../services/apiService.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { todayISO } from '../utils/formatDate.js';

const EMPTY = { type: 'Maintenance', title: '', dueDate: '', dueKm: '', intervalMonths: '', intervalKm: '' };

export default function ReminderFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [loadError, setLoadError] = useState('');
  const action = useAsyncAction();

  useEffect(() => {
    if (!isEdit) return;
    remindersApi.get(id).then((r) => {
      setForm({
        type: r.type,
        title: r.title || '',
        dueDate: r.dueDate ? r.dueDate.slice(0, 10) : '',
        dueKm: r.dueKm ?? '',
        intervalMonths: r.intervalMonths ?? '',
        intervalKm: r.intervalKm ?? '',
      });
    }).catch((e) => setLoadError(e.message));
  }, [id, isEdit]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function buildBody() {
    const body = { type: form.type };
    if (form.title) body.title = form.title;
    if (form.dueDate) body.dueDate = new Date(form.dueDate).toISOString();
    if (form.dueKm !== '') body.dueKm = Number(form.dueKm);
    if (form.intervalMonths !== '') body.intervalMonths = Number(form.intervalMonths);
    if (form.intervalKm !== '') body.intervalKm = Number(form.intervalKm);
    return body;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.dueDate && form.dueKm === '') {
      action.setError(t('errors.reminderMissingDue'));
      return;
    }
    await action.run(async () => {
      if (isEdit) await remindersApi.update(id, buildBody());
      else        await remindersApi.create(buildBody());
      navigate('/reminders');
    });
  }

  return (
    <div className="page">
      <h1>{isEdit ? t('reminders.editReminder') : t('reminders.newReminder')}</h1>
      {loadError && <ErrorBanner message={loadError} />}
      {action.error && <ErrorBanner message={action.error} />}
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <ReminderTypeSelect value={form.type} onChange={handleChange} />
        <div className="form-group">
          <label htmlFor="field-title">{t('reminders.fields.title')}</label>
          <input id="field-title" name="title" value={form.title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="field-dueDate">{t('reminders.fields.dueDate')}</label>
          <input
            id="field-dueDate"
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            min={todayISO()}
          />
        </div>
        <div className="form-group">
          <label htmlFor="field-dueKm">{t('reminders.fields.dueKm')}</label>
          <input id="field-dueKm" name="dueKm" type="number" min="0" value={form.dueKm} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="field-intervalMonths">{t('reminders.fields.intervalMonths')}</label>
          <input id="field-intervalMonths" name="intervalMonths" type="number" min="0"
                 value={form.intervalMonths} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="field-intervalKm">{t('reminders.fields.intervalKm')}</label>
          <input id="field-intervalKm" name="intervalKm" type="number" min="0"
                 value={form.intervalKm} onChange={handleChange} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn-primary" disabled={action.loading}>
            {action.loading ? t('common.saving') : t('common.save')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/reminders')}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
