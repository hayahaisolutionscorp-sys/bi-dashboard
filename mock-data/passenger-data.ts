export interface PassengersPerTripDataRow {
  report_date: string; // ISO Date String
  report_month: string; // e.g. "Feb 2026"
  trip_id: string;
  trip_status: string;
  route_name: string;
  vessel_name: string;
  vessel_type: string;
  total_ship_passenger_capacity: number;
  booking_source: string;
  discount_type: string | null;
  cabin_class_name: string | null;
  passenger_booking_status: string | null;
  passenger_sex: string | null;
  booking_type: string | null;
  passenger_count: number;
  passenger_revenue: number;
}

export const mockPassengerPerTripApi: PassengersPerTripDataRow[] = [
  { report_date: '2026-04-05', report_month: 'Apr 2026', trip_id: 't-04051', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'LLVN 1', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 16, passenger_revenue: 4150 },
  { report_date: '2026-04-05', report_month: 'Apr 2026', trip_id: 't-04051', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'otc', discount_type: 'Child', cabin_class_name: 'LLVN 1', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 5, passenger_revenue: 625 },
  { report_date: '2026-04-05', report_month: 'Apr 2026', trip_id: 't-04051', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'otc', discount_type: 'Senior', cabin_class_name: 'LLVN 2', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Round Trip', passenger_count: 7, passenger_revenue: 1680 },
  { report_date: '2026-04-05', report_month: 'Apr 2026', trip_id: 't-04051', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'online', discount_type: 'Adult', cabin_class_name: 'LLVN 1', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 12, passenger_revenue: 3120 },
  { report_date: '2026-03-15', report_month: 'Mar 2026', trip_id: 't-03151', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV alprince', vessel_type: 'roro', total_ship_passenger_capacity: 800, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'eco', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 35, passenger_revenue: 8750 },
  { report_date: '2026-03-15', report_month: 'Mar 2026', trip_id: 't-03151', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV alprince', vessel_type: 'roro', total_ship_passenger_capacity: 800, booking_source: 'walk_in', discount_type: 'Student', cabin_class_name: 'eco', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 15, passenger_revenue: 3000 },
  { report_date: '2026-03-08', report_month: 'Mar 2026', trip_id: 't-03081', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV Final Test', vessel_type: 'lct', total_ship_passenger_capacity: 300, booking_source: 'website', discount_type: 'Adult', cabin_class_name: 'Final', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 40, passenger_revenue: 10000 },
  { report_date: '2026-03-08', report_month: 'Mar 2026', trip_id: 't-03081', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV Final Test', vessel_type: 'lct', total_ship_passenger_capacity: 300, booking_source: 'otc', discount_type: 'PWD', cabin_class_name: 'Final', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 5, passenger_revenue: 1000 },
  { report_date: '2026-02-26', report_month: 'Feb 2026', trip_id: 't-02261', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'otc', discount_type: 'Driver', cabin_class_name: 'Economy', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 15, passenger_revenue: 225 },
  { report_date: '2026-02-26', report_month: 'Feb 2026', trip_id: 't-02261', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'mobile_app', discount_type: 'Adult', cabin_class_name: 'Aircon', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 22, passenger_revenue: 11330 },
  { report_date: '2026-02-21', report_month: 'Feb 2026', trip_id: 't-02211', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 85, passenger_revenue: 196775 },
  { report_date: '2026-02-21', report_month: 'Feb 2026', trip_id: 't-02211', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'website', discount_type: 'Child', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 30, passenger_revenue: 30450 },
  { report_date: '2026-02-20', report_month: 'Feb 2026', trip_id: 't-02201', trip_status: 'Completed', route_name: 'Dumlog - Poblacion', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'otc', discount_type: 'Senior', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 18, passenger_revenue: 14616 },
  { report_date: '2026-02-18', report_month: 'Feb 2026', trip_id: 't-02181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'otc', discount_type: 'Student', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 25, passenger_revenue: 18000 },
  { report_date: '2026-02-15', report_month: 'Feb 2026', trip_id: 't-02151', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'mobile_app', discount_type: 'PWD', cabin_class_name: 'LLVN 1', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 8, passenger_revenue: 5200 },
  { report_date: '2026-02-20', report_month: 'Feb 2026', trip_id: 't-02201', trip_status: 'Completed', route_name: 'Dumlog - Poblacion', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'mobile_app', discount_type: 'Adult', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 45, passenger_revenue: 104175 },
  { report_date: '2026-01-25', report_month: 'Jan 2026', trip_id: 't-01251', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'mobile_app', discount_type: 'Adult', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 50, passenger_revenue: 115000 },
  { report_date: '2026-01-18', report_month: 'Jan 2026', trip_id: 't-01181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'website', discount_type: 'Child', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 20, passenger_revenue: 20300 },
  { report_date: '2026-01-10', report_month: 'Jan 2026', trip_id: 't-01101', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'Aircon', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 45, passenger_revenue: 23175 },
  { report_date: '2026-01-05', report_month: 'Jan 2026', trip_id: 't-01051', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'walk_in', discount_type: 'Senior', cabin_class_name: 'LLVN 1', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 12, passenger_revenue: 2880 },
  { report_date: '2025-12-28', report_month: 'Dec 2025', trip_id: 't-12281', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Round Trip', passenger_count: 110, passenger_revenue: 89320 },
  { report_date: '2025-12-24', report_month: 'Dec 2025', trip_id: 't-12241', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'mobile_app', discount_type: 'Child', cabin_class_name: 'Economy', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 65, passenger_revenue: 9750 },
  { report_date: '2025-12-15', report_month: 'Dec 2025', trip_id: 't-12151', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV alprince', vessel_type: 'roro', total_ship_passenger_capacity: 800, booking_source: 'website', discount_type: 'Adult', cabin_class_name: 'eco', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Round Trip', passenger_count: 85, passenger_revenue: 21250 },
  { report_date: '2025-12-10', report_month: 'Dec 2025', trip_id: 't-12101', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV Final Test', vessel_type: 'lct', total_ship_passenger_capacity: 300, booking_source: 'otc', discount_type: 'PWD', cabin_class_name: 'Final', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 10, passenger_revenue: 2000 },
  { report_date: '2025-12-05', report_month: 'Dec 2025', trip_id: 't-12051', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'walk_in', discount_type: 'Student', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 40, passenger_revenue: 32480 },
  { report_date: '2025-12-01', report_month: 'Dec 2025', trip_id: 't-12011', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'mobile_app', discount_type: 'Senior', cabin_class_name: 'Aircon', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 18, passenger_revenue: 9270 },

  // Jan 2026 - all channels covered
  { report_date: '2026-01-10', report_month: 'Jan 2026', trip_id: 't-01101', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'mobile_app', discount_type: 'Adult', cabin_class_name: 'Aircon', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 28, passenger_revenue: 14420 },
  { report_date: '2026-01-10', report_month: 'Jan 2026', trip_id: 't-01101', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'walk_in', discount_type: 'Adult', cabin_class_name: 'Economy', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 19, passenger_revenue: 9785 },
  { report_date: '2026-01-10', report_month: 'Jan 2026', trip_id: 't-01101', trip_status: 'Completed', route_name: 'Bogo, Cebu - Cordova, Cebu', vessel_name: 'MV Ceven', vessel_type: 'roro', total_ship_passenger_capacity: 1200, booking_source: 'website', discount_type: 'Child', cabin_class_name: 'Economy', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 33, passenger_revenue: 16995 },
  { report_date: '2026-01-18', report_month: 'Jan 2026', trip_id: 't-01181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 55, passenger_revenue: 27500 },
  { report_date: '2026-01-18', report_month: 'Jan 2026', trip_id: 't-01181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'mobile_app', discount_type: 'Senior', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 38, passenger_revenue: 38760 },
  { report_date: '2026-01-18', report_month: 'Jan 2026', trip_id: 't-01181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'walk_in', discount_type: 'Student', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Round Trip', passenger_count: 22, passenger_revenue: 15840 },
  { report_date: '2026-01-25', report_month: 'Jan 2026', trip_id: 't-01251', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 42, passenger_revenue: 21000 },
  { report_date: '2026-01-25', report_month: 'Jan 2026', trip_id: 't-01251', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'walk_in', discount_type: 'PWD', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 14, passenger_revenue: 5740 },
  { report_date: '2026-01-25', report_month: 'Jan 2026', trip_id: 't-01251', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'website', discount_type: 'Adult', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Round Trip', passenger_count: 29, passenger_revenue: 66700 },

  // Feb 2026 - all channels extended
  { report_date: '2026-02-15', report_month: 'Feb 2026', trip_id: 't-02151', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'otc', discount_type: 'Adult', cabin_class_name: 'LLVN 1', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 48, passenger_revenue: 12480 },
  { report_date: '2026-02-15', report_month: 'Feb 2026', trip_id: 't-02151', trip_status: 'Completed', route_name: 'Val - OCAMPO', vessel_name: 'MV LLVN', vessel_type: 'roro', total_ship_passenger_capacity: 1500, booking_source: 'walk_in', discount_type: 'Child', cabin_class_name: 'LLVN 2', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 17, passenger_revenue: 2125 },
  { report_date: '2026-02-18', report_month: 'Feb 2026', trip_id: 't-02181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'mobile_app', discount_type: 'Adult', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 62, passenger_revenue: 143660 },
  { report_date: '2026-02-18', report_month: 'Feb 2026', trip_id: 't-02181', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'website', discount_type: 'Senior', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 35, passenger_revenue: 28420 },
  { report_date: '2026-02-20', report_month: 'Feb 2026', trip_id: 't-02201', trip_status: 'Completed', route_name: 'Dumlog - Poblacion', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'walk_in', discount_type: 'Adult', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Single', passenger_count: 27, passenger_revenue: 13500 },
  { report_date: '2026-02-21', report_month: 'Feb 2026', trip_id: 't-02211', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'mobile_app', discount_type: 'Adult', cabin_class_name: 'Deluxe Lodge', passenger_booking_status: 'Boarded', passenger_sex: 'male', booking_type: 'Single', passenger_count: 44, passenger_revenue: 101860 },
  { report_date: '2026-02-21', report_month: 'Feb 2026', trip_id: 't-02211', trip_status: 'Completed', route_name: 'Poblacion - Dumlog', vessel_name: 'MV Ayahay', vessel_type: 'roro', total_ship_passenger_capacity: 2500, booking_source: 'walk_in', discount_type: 'Student', cabin_class_name: 'Economy A', passenger_booking_status: 'Boarded', passenger_sex: 'female', booking_type: 'Round Trip', passenger_count: 19, passenger_revenue: 13680 },
];

export function generatePassengerDashboardData(rows: PassengersPerTripDataRow[], dateRange?: { from?: Date; to?: Date }) {
  const filteredRows = rows.filter(row => {
    if (!dateRange || !dateRange.from) return true;
    const rowDate = new Date(row.report_date);
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0,0,0,0);
    const toDate = dateRange.to ? new Date(dateRange.to) : undefined;
    if (toDate) toDate.setHours(23,59,59,999);
    
    if (rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;
    return true;
  });

  // Aggregate KPIs
  let totalPassengers = 0;
  let totalRevenue = 0;
  const uniqueTrips = new Set<string>();
  const routeStats: Record<string, { totalPassengers: number; totalCapacity: number, uniqueTrips: Set<string> }> = {};

  // Dimensional Stats
  const revenueTrendData: Record<string, number> = {};
  const bookingSources: Record<string, number> = {};
  const discountTypes: Record<string, number> = {};
  const bookingTypeData: Record<string, number> = { Single: 0, 'Round Trip': 0, unspecified: 0 };
  
  const channelsByDate: Record<string, Record<string, number>> = {};
  const allChannels = new Set<string>();

  filteredRows.forEach((row) => {
    totalPassengers += row.passenger_count;
    totalRevenue += row.passenger_revenue;
    uniqueTrips.add(row.trip_id);

    // Route Stats for Load Factor
    if (!routeStats[row.route_name]) {
      routeStats[row.route_name] = { totalPassengers: 0, totalCapacity: 0, uniqueTrips: new Set() };
    }
    routeStats[row.route_name].totalPassengers += row.passenger_count;
    if (!routeStats[row.route_name].uniqueTrips.has(row.trip_id)) {
      routeStats[row.route_name].totalCapacity += row.total_ship_passenger_capacity;
      routeStats[row.route_name].uniqueTrips.add(row.trip_id);
    }

    // Revenue Trend by Date (for time toggle support)
    const dateStrTrend = row.report_date;
    revenueTrendData[dateStrTrend] = (revenueTrendData[dateStrTrend] || 0) + row.passenger_revenue;

    // Booking Source Breakdown
    const sourceLabel = row.booking_source || 'Unknown';
    bookingSources[sourceLabel] = (bookingSources[sourceLabel] || 0) + row.passenger_count;

    // Time-based Channels Breakdown
    const dateStr = row.report_date;
    if (!channelsByDate[dateStr]) channelsByDate[dateStr] = {};
    channelsByDate[dateStr][sourceLabel] = (channelsByDate[dateStr][sourceLabel] || 0) + row.passenger_count;
    allChannels.add(sourceLabel);
    
    // Booking Type Breakdown
    const typeLabel = row.booking_type === 'Single' || row.booking_type === 'Round Trip' ? row.booking_type : 'unspecified';
    bookingTypeData[typeLabel] += row.passenger_count;

    // Demographics Breakdown
    const discountLabel = row.discount_type || 'Regular';
    discountTypes[discountLabel] = (discountTypes[discountLabel] || 0) + row.passenger_count;
  });

  const avgPaxPerTrip = uniqueTrips.size > 0 ? (totalPassengers / uniqueTrips.size).toFixed(1) : "0";
  const avgRevPerPax = totalPassengers > 0 ? (totalRevenue / totalPassengers).toFixed(2) : "0";

  // Calculate Overall Load Factor
  let totalSystemCapacity = 0;
  Object.values(routeStats).forEach(route => totalSystemCapacity += route.totalCapacity);
  const overallLoadFactor = totalSystemCapacity > 0 ? ((totalPassengers / totalSystemCapacity) * 100).toFixed(1) : "0";

  // Format KPIs
  const kpiData = [
    { title: "Load Factor", value: `${overallLoadFactor}%`, change: "0%", trend: "neutral", description: "vs last month", icon: "users" },
    { title: "Rev / Passenger", value: `₱${parseInt(avgRevPerPax).toLocaleString()}`, change: "0%", trend: "neutral", description: "vs last month", icon: "wallet" },
    { title: "Total Passengers", value: totalPassengers.toLocaleString(), change: "0%", trend: "neutral", description: "vs last month", icon: "user" },
    { title: "Avg Pax/Trip", value: avgPaxPerTrip, change: "0%", trend: "neutral", description: "vs last month", icon: "trending-up" },
  ];

  // Colors for charts
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  // Format Dimensions
  const bookingChannelsData = Object.entries(bookingSources)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));

  const discountDemographicsData = Object.entries(discountTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));

  const bookingTypeDemographics = Object.entries(bookingTypeData)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));

  // Time-based Clustered Bar format: xAxis dates, and series data per channel
  const sortedDates = Object.keys(channelsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  const bookingChannelTrendSeries = Array.from(allChannels).map((channel, idx) => {
     return {
         name: channel,
         type: "bar" as const,
         data: sortedDates.map(date => channelsByDate[date][channel] || 0),
         color: colors[idx % colors.length]
     };
  });

  const bookingChannelTrendData = {
     xAxis: sortedDates,
     series: bookingChannelTrendSeries
  };

  const sortedMonths = Object.keys(revenueTrendData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const trendSeries = sortedMonths.map(month => revenueTrendData[month]);

  // Route Efficiency calculation
  const routeEfficiencyData: any[] = [];
  Object.entries(routeStats).forEach(([route, stats]) => {
     const reqLF = stats.totalCapacity > 0 ? (stats.totalPassengers / stats.totalCapacity) * 100 : 0;
     routeEfficiencyData.push({ label: route, value: Number(reqLF.toFixed(1)), color: "#3b82f6" });
  });
  routeEfficiencyData.sort((a, b) => b.value - a.value);

  // Mark highest and lowest route natively if needed
  if (routeEfficiencyData.length > 0) {
     kpiData.push({ title: "Best Route", value: routeEfficiencyData[0].label, change: `${routeEfficiencyData[0].value}% LF`, trend: "up", description: "Highest Capacity Utilization", icon: "map-pin" });
  }
  if (routeEfficiencyData.length > 1) {
      kpiData.push({ title: "Least Route", value: routeEfficiencyData[routeEfficiencyData.length - 1].label, change: `${routeEfficiencyData[routeEfficiencyData.length - 1].value}% LF`, trend: "down", description: "Lowest Capacity Utilization", icon: "alert-circle" });
  }

  return {
    kpiData,
    trendData: { xAxis: sortedMonths, series: trendSeries },
    bookingChannelsData,
    discountDemographicsData,
    bookingTypeDemographics,
    bookingChannelTrendData,
    routeEfficiencyData
  };
}
