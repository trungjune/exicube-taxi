import React,{ useState,useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector} from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { useTranslation } from "react-i18next";
import {colors} from '../components/Theme/WebTheme';

export default function Earningreports() {
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  
  const settings = useSelector(state => state.settingsdata.settings);

    const columns =  [
        { title: t('year'),field: 'year', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('months'), field: 'monthsName', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('booking_count'), field: 'total_rides', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('Gross_trip_cost'),  render: rowData => (parseFloat(rowData.tripCost) + parseFloat(rowData.cancellationFee)).toFixed(settings.decimal) , editable:'never', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('trip_cost_driver_share'), field: 'rideCost', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('cancellationFee'), field: 'cancellationFee', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('convenience_fee'), field: 'convenienceFee', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('Discounts'), field: 'discountAmount', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
        { title: t('Profit'),  render: rowData => (parseFloat(rowData.convenienceFee) + parseFloat(rowData.cancellationFee) - parseFloat(rowData.discountAmount)).toFixed(settings.decimal) , editable:'never', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
    ];

  const [data, setData] = useState([]);
  const earningreportsdata = useSelector(state => state.earningreportsdata);

  useEffect(()=>{
        if(earningreportsdata.Earningreportss){
            setData(earningreportsdata.Earningreportss);
        }
  },[earningreportsdata.Earningreportss]);

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    earningreportsdata.loading? <CircularLoading/>:
    <MaterialTable
      title={t('earning_reports')}
      columns={columns}
      style={{direction:isRTL ==='rtl'?'rtl':'ltr', borderRadius: "8px", boxShadow: "4px 4px 6px #9E9E9E"}}
      data={data}
      onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
      options={{
        exportButton: true,
        rowStyle: rowData => ({
          backgroundColor: (selectedRow === rowData.tableData.id) ? '#EEE' : '#FFF'
        }),
        editable:{
          backgroundColor: colors.Header_Text,
          fontSize: "0.8em",
          fontWeight: 'bold ',
          fontFamily: 'Lucida Console", "Courier New", monospace'
        },
        headerStyle: {
          position: "sticky",
          top: "0px",
          backgroundColor: colors.Header_Text_back ,
          color: '#fff',
          fontSize: "0.8em",
          fontWeight: 'bold ',
          fontFamily: 'Lucida Console", "Courier New", monospace'
        },
      }}
      localization={{
        toolbar: {
          searchPlaceholder: (t('search')),
          exportTitle: (t('export')),
        },
        pagination: {
          labelDisplayedRows: ('{from}-{to} '+ (t('of'))+ ' {count}'),
          firstTooltip: (t('first_page_tooltip')),
          previousTooltip: (t('previous_page_tooltip')),
          nextTooltip: (t('next_page_tooltip')),
          lastTooltip: (t('last_page_tooltip'))
        },
      }}
      
    />
  );
}
