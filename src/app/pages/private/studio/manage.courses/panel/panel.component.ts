// panel.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import {
  DashboardPanelResponse,
  TestPerformanceMetric,
  CoursePopularityMetric,
  CategoryInterestMetric
} from '../../../../../core/api/dashboard/panel.interfaces';
import { DashboardService } from '../../../../../core/api/dashboard/dashboard.service';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css'
})
export class PanelComponent implements OnInit {

  // estado
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly panel = signal<DashboardPanelResponse | null>(null);

  // opciones de los gráficos
  readonly contentCompletionOptions = signal<EChartsCoreOption | null>(null);
  readonly testPerformanceOptions   = signal<EChartsCoreOption | null>(null);
  readonly coursePopularityOptions  = signal<EChartsCoreOption | null>(null);
  readonly ratingDistributionOptions = signal<EChartsCoreOption | null>(null);
  readonly categoryInterestOptions  = signal<EChartsCoreOption | null>(null);

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadPanel();
  }

  private loadPanel(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getPanel().subscribe({
      next: (response) => {
        this.panel.set(response);
        this.setupCharts(response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando panel', err);
        this.error.set('No se pudieron cargar las métricas del panel.');
        this.loading.set(false);
      }
    });
  }

  private setupCharts(data: DashboardPanelResponse): void {
    this.setupContentCompletionChart(data.metrics.content_completion);
    this.setupTestPerformanceChart(data.metrics.test_performance);
    this.setupCoursePopularityChart(data.metrics.course_popularity);
    this.setupRatingsChart(data.metrics.course_ratings);
    this.setupCategoryInterestChart(data.metrics.category_interests);
  }

  // === Gráfico: Finalización de contenidos (donut) ===
  private setupContentCompletionChart(
    metric: DashboardPanelResponse['metrics']['content_completion']
  ): void {
    const { completed, in_progress, total_views } = metric;
    const notStarted = Math.max(total_views - completed - in_progress, 0);

    this.contentCompletionOptions.set({
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        textStyle: { color: '#888' }
      },
      series: [
        {
          name: 'Estado',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: [
            { value: completed,   name: 'Completado' },
            { value: in_progress, name: 'En progreso' },
            { value: notStarted,  name: 'Sin iniciar' }
          ]
        }
      ]
    });
  }

  // === Gráfico: Rendimiento por evaluación ===
  private setupTestPerformanceChart(metrics: TestPerformanceMetric[]): void {
    const labels   = metrics.map(m => m.label);
    const scores   = metrics.map(m => m.avg_score);
    const attempts = metrics.map(m => m.attempts);

    this.testPerformanceOptions.set({
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Promedio', 'Intentos'],
        textStyle: { color: '#888' }
      },
      grid: { left: 40, right: 20, bottom: 40, top: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { rotate: 30 }
      },
      yAxis: [
        { type: 'value', name: 'Promedio' },
        { type: 'value', name: 'Intentos' }
      ],
      series: [
        {
          name: 'Promedio',
          type: 'bar',
          data: scores,
          yAxisIndex: 0
        },
        {
          name: 'Intentos',
          type: 'line',
          data: attempts,
          yAxisIndex: 1,
          smooth: true
        }
      ]
    });
  }

  // === Gráfico: Popularidad de cursos (inscripciones por mes) ===
  private setupCoursePopularityChart(metrics: CoursePopularityMetric[]): void {
    const labels = metrics.map(m => m.month);
    const values = metrics.map(m => m.total);

    this.coursePopularityOptions.set({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, bottom: 40, top: 40 },
      xAxis: {
        type: 'category',
        data: labels
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Inscripciones',
          type: 'line',
          smooth: true,
          data: values
        }
      ]
    });
  }

  // === Gráfico: Distribución de ratings ===
  private setupRatingsChart(
    metric: DashboardPanelResponse['metrics']['course_ratings']
  ): void {
    const labels = metric.distribution.map(d => `${d.stars} ★`);
    const values = metric.distribution.map(d => d.total);

    this.ratingDistributionOptions.set({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, bottom: 40, top: 40 },
      xAxis: {
        type: 'category',
        data: labels
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: values
        }
      ]
    });
  }

  // === Gráfico: Intereses por categoría ===
  private setupCategoryInterestChart(metrics: CategoryInterestMetric[]): void {
    const labels = metrics.map(m => m.name);
    const values = metrics.map(m => m.total);

    this.categoryInterestOptions.set({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, bottom: 40, top: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: values
        }
      ]
    });
  }
}

