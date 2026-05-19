'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { expensesApi } from '@/services/apiService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import KpiCard from '@/components/KpiCard.jsx';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart.jsx';
import CategoryDonut from '@/components/charts/CategoryDonut.jsx';
import Loading from '@/components/Loading.jsx';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import {
  aggregateByMonth,
  aggregateByCategory,
  computeMtd,
  computeYtd,
  computeFuelShare,
  computeAvgMonthly,
  computePrevMonthTotal,
} from '@/utils/aggregations.js';
import { formatDate } from '@/utils/formatDate.js';
import { formatCurrency } from '@/utils/formatCurrency.js';
import { categoryLabel } from '@/utils/categories.js';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currency } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const now = new Date();
        const isJanuary = now.getMonth() === 0;

        const requests = [expensesApi.list({ year: currentYear })];
        if (isJanuary) {
          requests.push(expensesApi.list({ year: currentYear - 1 }));
        }

        const results = await Promise.all(requests);
        if (cancelled) return;

        const curYearData = results[0];
        const prevYearData = isJanuary ? results[1] : [];
        const allExpenses = [...prevYearData, ...curYearData];

        setExpenses(allExpenses.map((e) => ({ ...e, _curYear: e.date.startsWith(String(currentYear)) })));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [currentYear]);

  if (loading) return <Loading />;
  if (error) return <ErrorBanner message={error} />;

  const curYearExpenses = expenses.filter((e) => e._curYear);

  const mtd = computeMtd(curYearExpenses);
  const prevMonthTotal = computePrevMonthTotal(expenses);
  const mtdDelta = prevMonthTotal > 0
    ? Math.round(((mtd - prevMonthTotal) / prevMonthTotal) * 1000) / 10
    : null;

  const ytd = computeYtd(curYearExpenses);
  const fuelShare = computeFuelShare(curYearExpenses);

  const monthlyData = aggregateByMonth(curYearExpenses);
  const avgMonthly = computeAvgMonthly(monthlyData);

  const categoryData = aggregateByCategory(curYearExpenses);

  const last6Months = monthlyData.slice(-6);

  const recentExpenses = [...curYearExpenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{t('dashboard.heading')}</h1>

      <div className={styles.kpiRow}>
        <KpiCard
          label={t('dashboard.thisMonth')}
          value={formatCurrency(mtd, currency)}
          delta={mtdDelta}
          sparkData={last6Months}
          invertColors
        />
        <KpiCard
          label={t('dashboard.totalSpent')}
          subtitle={String(currentYear)}
          value={formatCurrency(ytd, currency)}
          delta={null}
          sparkData={monthlyData}
        />
        <KpiCard
          label={t('dashboard.avgMonthly')}
          subtitle={String(currentYear)}
          value={formatCurrency(avgMonthly, currency)}
          delta={null}
          sparkData={monthlyData}
        />
        <KpiCard
          label={t('dashboard.fuelShare')}
          subtitle={String(currentYear)}
          value={`${fuelShare}%`}
          delta={null}
          sparkData={null}
        />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.sectionTitle}>{t('dashboard.monthlySpend', { year: currentYear })}</h2>
          <MonthlyTrendChart data={monthlyData} />
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.sectionTitle}>{t('dashboard.byCategory')}</h2>
          <CategoryDonut data={categoryData} currency={currency} />
        </div>
      </div>

      <div className={styles.recentCard}>
        <div className={styles.recentHeader}>
          <h2 className={styles.sectionTitle}>{t('dashboard.recentExpenses')}</h2>
          <Link href="/expenses" className={styles.viewAll}>View all →</Link>
        </div>

        {recentExpenses.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem 0' }}>
            {t('dashboard.noExpenses')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.recentTable}>
              <thead>
                <tr>
                  <th scope="col" className={styles.thDate}>{t('dashboard.date')}</th>
                  <th scope="col" className={styles.thCategory}>{t('dashboard.category')}</th>
                  <th scope="col" className={`num ${styles.thAmount}`}>{t('dashboard.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className={styles.dateCell}>{formatDate(exp.date)}</td>
                    <td>
                      <span className="badge" data-cat={exp.category}>{categoryLabel(exp.category, t)}</span>
                    </td>
                    <td className={`num ${styles.amountCell}`}>{formatCurrency(exp.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
