import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import styled from 'styled-components';
import { apiClient } from '../api/client.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

// Dark theme configuration for charts
ChartJS.defaults.color = '#a0aec0';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.15)';

const DashboardContainer = styled.div`
  ${'' /* background-color: #0f172a; */}
  min-height: 100vh;
  color: #f8fafc;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.section`
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 2rem 0;
  color: #E1EBF9FF;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
`;

const KPICard = styled.div`
  background: #3341556F;
  padding: 1.75rem;
  border-radius: 0.75rem;
  border-left: 4px solid #48bb78;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #94a3b8;
  }

  p {
    font-size: 2rem;
    margin: 0;
    font-weight: 600;
    color: #f8fafc;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  gap: 2rem;
  grid-template-columns: ${props => props.columns || '1fr'};
  height: ${props => props.height || 'auto'};
`;

const ChartContainer = styled.div`
  position: relative;
  height: ${props => props.height || '200px'};
  background: #1E293B72;
  border-radius: 0.75rem;
  padding: 1.5rem;
`;

export default function AdminDashboard({ role }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/api/adminStat', {
          signal: abortController.signal
        });
        if (isMounted) {
          setDashboardData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          setError(err.message || 'Failed to fetch dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchDashboardData();

    // Set up polling
    const pollInterval = setInterval(fetchDashboardData, 10000); // Update every 10 seconds

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(pollInterval);
    };
  }, []);

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { size: 14 },
          padding: 20
        }
      },
      title: {
        display: true,
        text: title,
        color: '#f8fafc',
        font: { size: 20, weight: '500' },
        padding: { bottom: 20 }
      }
    },
    elements: {
      arc: { borderWidth: 0 },
      bar: { borderRadius: 4 }
    }
  });

  if (loading) return <DashboardContainer>Loading...</DashboardContainer>;
  if (error) return <DashboardContainer>Error: {error}</DashboardContainer>;

  return (
    <DashboardContainer>

      <Section>
        <SectionTitle>👥 User Engagement & Activity</SectionTitle>
        <KPIGrid>
          <KPICard>
            <h3>Total Users</h3>
            <p>{dashboardData.kpis.totalUsers}</p>
          </KPICard>
          <KPICard>
            <h3 className="tw-flex tw-items-center tw-gap-2">
              Active Users
              <span
                className={`tw-inline-block tw-w-3 tw-h-3 tw-rounded-full ${dashboardData.kpis.activeUsers >= 1
                  ? 'tw-bg-green-500 tw-animate-glow-green'
                  : 'tw-bg-red-500 tw-animate-glow-red'
                  }`}
              />
            </h3>
            <p>{dashboardData.kpis.activeUsers}</p>
          </KPICard>
          <KPICard>
            <h3>CVs Uploaded</h3>
            <p>{dashboardData.kpis.cvCount}</p>
          </KPICard>
          <KPICard>
            <h3>Total Companies</h3>
            <p>{dashboardData.kpis.totalCompanies}</p>
          </KPICard>
        </KPIGrid>

        <ChartGrid>
          <ChartContainer height="500px">
            <Doughnut
              data={dashboardData.charts.userDistribution.data}
              options={chartOptions('User Role Distribution')}
            />
          </ChartContainer>
        </ChartGrid>
      </Section>

      {/* Job Market Section */}
      <Section>
        <SectionTitle>💼 Job Market Insights</SectionTitle>
        <KPIGrid>
          <KPICard>
            <h3>Jobs Posted</h3>
            <p>{dashboardData.kpis.totalJobs}</p>
          </KPICard>
          <KPICard>
            <h3>Recommended Jobs</h3>
            <p>{dashboardData.kpis.recommendedJobs}</p>
          </KPICard>
        </KPIGrid>

        <ChartGrid columns="repeat(auto-fit, minmax(600px, 1fr))">
          <ChartContainer height="450px">
            <Pie
              data={dashboardData.charts.experienceDistribution.data}
              options={chartOptions('Experience Level Distribution')}
            />
          </ChartContainer>
          <ChartContainer height="500px">
            <Pie
              data={dashboardData.charts.industryDistribution.data}
              options={chartOptions('Industry Distribution')}
            />
          </ChartContainer>
        </ChartGrid>
      </Section>

      {/* Skills Section */}
      <Section>
        <SectionTitle>🚀 Skills & Competencies</SectionTitle>
        <ChartGrid>
          <ChartContainer height="500px">
            <Bar
              color='#5BCBDFFF'
              data={dashboardData.charts.topSkills.data}
              options={{
                ...chartOptions('Top 10 In-Demand Skills'),
                indexAxis: 'x',
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#cbd5e1', font: { size: 14 } }
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: '#cbd5e1', font: { size: 14 } }
                  }
                }
              }}
            />
          </ChartContainer>
        </ChartGrid>
      </Section>
    </DashboardContainer>
  );
};

