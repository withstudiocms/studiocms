import type { WebVitalsResponseItem } from '../types.js';
import { checkDate } from './checkDate.js';
import {
	calculateClsAverage,
	calculateClsScoreText,
	calculateInpAverage,
	calculateInpScoreText,
	calculateLcpAverage,
	calculateLcpScoreText,
} from './webVitalsUtils.js';

export type perPageDataEntry = {
	pageRoute: string;
	sampleSize: number;
	CLS: {
		average: number;
		rating: string;
	};
	LCP: {
		average: number;
		rating: string;
	};
	INP: {
		average: number;
		rating: string;
	};
};

type RouteArrayEntry = {
	route: string;
	samplesize: number;
	clsvalue: number[];
	lcpvalue: number[];
	inpvalue: number[];
};

export const buildPerPageRouteDataObject = (webVitalData: WebVitalsResponseItem[]) => {
	const RouteArray: RouteArrayEntry[] = [];
	const last24HoursData: RouteArrayEntry[] = [];
	const last7DaysData: RouteArrayEntry[] = [];
	const last30DaysData: RouteArrayEntry[] = [];

	for (const item of webVitalData) {
		const { route, timestamp } = item;

		if (checkDate(timestamp).isInLast24Hours()) {
			const index = last24HoursData.findIndex((entry) => entry.route === route);

			if (index !== -1) {
				last24HoursData[index].samplesize += 1;
				if (item.name === 'CLS') {
					last24HoursData[index].clsvalue.push(item.value);
				}
				if (item.name === 'LCP') {
					last24HoursData[index].lcpvalue.push(item.value);
				}
				if (item.name === 'INP') {
					last24HoursData[index].inpvalue.push(item.value);
				}
			} else {
				last24HoursData.push({
					route,
					samplesize: 1,
					clsvalue: item.name === 'CLS' ? [item.value] : [],
					lcpvalue: item.name === 'LCP' ? [item.value] : [],
					inpvalue: item.name === 'INP' ? [item.value] : [],
				});
			}
		}
		if (checkDate(timestamp).isInLast7Days()) {
			const index = last7DaysData.findIndex((entry) => entry.route === route);

			if (index !== -1) {
				last7DaysData[index].samplesize += 1;
				if (item.name === 'CLS') {
					last7DaysData[index].clsvalue.push(item.value);
				}
				if (item.name === 'LCP') {
					last7DaysData[index].lcpvalue.push(item.value);
				}
				if (item.name === 'INP') {
					last7DaysData[index].inpvalue.push(item.value);
				}
			} else {
				last7DaysData.push({
					route,
					samplesize: 1,
					clsvalue: item.name === 'CLS' ? [item.value] : [],
					lcpvalue: item.name === 'LCP' ? [item.value] : [],
					inpvalue: item.name === 'INP' ? [item.value] : [],
				});
			}
		}
		if (checkDate(timestamp).isInLast30Days()) {
			const index = last30DaysData.findIndex((entry) => entry.route === route);

			if (index !== -1) {
				last30DaysData[index].samplesize += 1;
				if (item.name === 'CLS') {
					last30DaysData[index].clsvalue.push(item.value);
				}
				if (item.name === 'LCP') {
					last30DaysData[index].lcpvalue.push(item.value);
				}
				if (item.name === 'INP') {
					last30DaysData[index].inpvalue.push(item.value);
				}
			} else {
				last30DaysData.push({
					route,
					samplesize: 1,
					clsvalue: item.name === 'CLS' ? [item.value] : [],
					lcpvalue: item.name === 'LCP' ? [item.value] : [],
					inpvalue: item.name === 'INP' ? [item.value] : [],
				});
			}
		}

		const index = RouteArray.findIndex((entry) => entry.route === route);

		if (index !== -1) {
			RouteArray[index].samplesize += 1;
			if (item.name === 'CLS') {
				RouteArray[index].clsvalue.push(item.value);
			}
			if (item.name === 'LCP') {
				RouteArray[index].lcpvalue.push(item.value);
			}
			if (item.name === 'INP') {
				RouteArray[index].inpvalue.push(item.value);
			}
		} else {
			RouteArray.push({
				route,
				samplesize: 1,
				clsvalue: item.name === 'CLS' ? [item.value] : [],
				lcpvalue: item.name === 'LCP' ? [item.value] : [],
				inpvalue: item.name === 'INP' ? [item.value] : [],
			});
		}
	}

	const perPageData: perPageDataEntry[] = [];
	const last24HoursPerPageData: perPageDataEntry[] = [];
	const last7DaysPerPageData: perPageDataEntry[] = [];
	const last30DaysPerPageData: perPageDataEntry[] = [];

	for (const item of RouteArray) {
		const { route, samplesize, clsvalue, lcpvalue, inpvalue } = item;

		const clsAverage = calculateClsAverage(clsvalue);
		const lcpAverage = calculateLcpAverage(lcpvalue);
		const inpAverage = calculateInpAverage(inpvalue);

		perPageData.push({
			pageRoute: route,
			sampleSize: samplesize,
			CLS: {
				average: clsAverage,
				rating: calculateClsScoreText(clsAverage),
			},
			LCP: {
				average: lcpAverage,
				rating: calculateLcpScoreText(lcpAverage),
			},
			INP: {
				average: inpAverage,
				rating: calculateInpScoreText(inpAverage),
			},
		});
	}

	for (const item of last24HoursData) {
		const { route, samplesize, clsvalue, lcpvalue, inpvalue } = item;

		const clsAverage = calculateClsAverage(clsvalue);
		const lcpAverage = calculateLcpAverage(lcpvalue);
		const inpAverage = calculateInpAverage(inpvalue);

		last24HoursPerPageData.push({
			pageRoute: route,
			sampleSize: samplesize,
			CLS: {
				average: clsAverage,
				rating: calculateClsScoreText(clsAverage),
			},
			LCP: {
				average: lcpAverage,
				rating: calculateLcpScoreText(lcpAverage),
			},
			INP: {
				average: inpAverage,
				rating: calculateInpScoreText(inpAverage),
			},
		});
	}

	for (const item of last7DaysData) {
		const { route, samplesize, clsvalue, lcpvalue, inpvalue } = item;

		const clsAverage = calculateClsAverage(clsvalue);
		const lcpAverage = calculateLcpAverage(lcpvalue);
		const inpAverage = calculateInpAverage(inpvalue);

		last7DaysPerPageData.push({
			pageRoute: route,
			sampleSize: samplesize,
			CLS: {
				average: clsAverage,
				rating: calculateClsScoreText(clsAverage),
			},
			LCP: {
				average: lcpAverage,
				rating: calculateLcpScoreText(lcpAverage),
			},
			INP: {
				average: inpAverage,
				rating: calculateInpScoreText(inpAverage),
			},
		});
	}

	for (const item of last30DaysData) {
		const { route, samplesize, clsvalue, lcpvalue, inpvalue } = item;

		const clsAverage = calculateClsAverage(clsvalue);
		const lcpAverage = calculateLcpAverage(lcpvalue);
		const inpAverage = calculateInpAverage(inpvalue);

		last30DaysPerPageData.push({
			pageRoute: route,
			sampleSize: samplesize,
			CLS: {
				average: clsAverage,
				rating: calculateClsScoreText(clsAverage),
			},
			LCP: {
				average: lcpAverage,
				rating: calculateLcpScoreText(lcpAverage),
			},
			INP: {
				average: inpAverage,
				rating: calculateInpScoreText(inpAverage),
			},
		});
	}

	return {
		historicalData: perPageData,
		last24HoursData: last24HoursPerPageData,
		last7DaysData: last7DaysPerPageData,
		last30DaysData: last30DaysPerPageData,
	};
};
