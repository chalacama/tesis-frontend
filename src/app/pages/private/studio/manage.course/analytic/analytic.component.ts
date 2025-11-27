import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import {
  DashboardAnalyticsResponse,
  RetentionFunnelItem,
  CertificationMetric,
  ProgressDistributionMetric,
  DifficultQuestionMetric
} from '../../../../../core/api/dashboard/analytic.interfaces';
import { DashboardService } from '../../../../../core/api/dashboard/dashboard.service';

@Component({
  selector: 'app-analytic',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './analytic.component.html',
  styleUrl: './analytic.component.css'
})
export class AnalyticComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly dashboardService = inject(DashboardService);

  // estado
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<DashboardAnalyticsResponse | null>(null);

  // opciones de gráficos
  readonly retentionFunnelOptions = signal<EChartsCoreOption | null>(null);
  readonly certificationOptions = signal<EChartsCoreOption | null>(null);
  readonly progressDistributionOptions = signal<EChartsCoreOption | null>(null);
  readonly difficultQuestionsOptions = signal<EChartsCoreOption | null>(null);

  ngOnInit(): void {
    // El id del curso viene del padre: /studio/:id/analytic
    const parent = this.route.parent ?? this.route;
    const idParam = parent.snapshot.paramMap.get('id');
    const courseId = Number(idParam);

    if (!courseId) {
      this.error.set('Curso inválido.');
      this.loading.set(false);
      return;
    }

    this.loadAnalytics(courseId);
  }

  private loadAnalytics(courseId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getCourseAnalytics(courseId).subscribe({
      next: (response) => {
        this.analytics.set(response);
        this.setupCharts(response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando analítica del curso', err);
        this.error.set('No se pudieron cargar las métricas de este curso.');
        this.loading.set(false);
      }
    });
  }

  private setupCharts(data: DashboardAnalyticsResponse): void {
    this.setupRetentionFunnelChart(data.metrics.retention_funnel);
    this.setupCertificationChart(data.metrics.certification);
    this.setupProgressDistributionChart(data.metrics.progress_distribution);
    this.setupDifficultQuestionsChart(data.metrics.top_difficult_questions);
  }

  // === A) Embudo de retención por módulo ===
  private setupRetentionFunnelChart(items: RetentionFunnelItem[]): void {
    const labels = items.map(m => m.name);
    const values = items.map(m => m.students_completed);

    this.retentionFunnelOptions.set({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, bottom: 60, top: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 30 }
      },
      yAxis: {
        type: 'value',
        name: 'Alumnos'
      },
      series: [
        {
          type: 'bar',
          data: values
        }
      ]
    });
  }

  // === B) Tasa de certificación ===
  private setupCertificationChart(metric: CertificationMetric): void {
    const { registrations, certificates, rate } = metric;
    const noCert = Math.max(registrations - certificates, 0);

    this.certificationOptions.set({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#888' }
      },
      series: [
        {
          name: 'Certificación',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              formatter: () => `Tasa\n${rate.toFixed(1)}%`,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: { show: false },
          data: [
            { value: certificates, name: 'Certificados' },
            { value: noCert, name: 'Sin certificado' }
          ]
        }
      ]
    });
  }

  // === C) Distribución de progreso ===
  private setupProgressDistributionChart(
    metric: ProgressDistributionMetric
  ): void {
    const labels = metric.buckets.map(b => b.label);
    const values = metric.buckets.map(b => b.percentage);

    this.progressDistributionOptions.set({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p.name}: ${p.value}%`;
        }
      },
      grid: { left: 80, right: 20, bottom: 40, top: 30 },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' },
        name: '% de alumnos'
      },
      yAxis: {
        type: 'category',
        data: labels
      },
      series: [
        {
          type: 'bar',
          data: values
        }
      ]
    });
  }

  // === D) Top 5 preguntas difíciles ===
  private setupDifficultQuestionsChart(items: DifficultQuestionMetric[]): void {
    const labels = items.map(q => q.statement);
    const values = items.map(q => q.wrong_attempts);

    this.difficultQuestionsOptions.set({
      tooltip: { trigger: 'axis' },
      grid: { left: 120, right: 20, bottom: 40, top: 20 },
      xAxis: {
        type: 'value',
        name: 'Intentos incorrectos'
      },
      yAxis: {
        type: 'category',
        data: labels
      },
      series: [
        {
          type: 'bar',
          data: values
        }
      ]
    });
  }
}

