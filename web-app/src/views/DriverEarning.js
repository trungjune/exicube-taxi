import React,{ useState,useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { useTranslation } from "react-i18next";
import {colors} from '../components/Theme/WebTheme';

export default function DriverEarning() {
  
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();

  const columns =  [
      { title: t('year'),field: 'year', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
      { title: t('months'), field: 'monthsName', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
      { title: t('driver_name'), field: 'driverName', cellStyle:{paddingRight: isRTL=== 'rtl'?'10%':null, textAlign:isRTL=== 'rtl'?'right': null}, headerStyle:{paddingRight: isRTL=== 'rtl'?'10%':null,textAlign:isRTL=== 'rtl'?'right': null}},
      { title: t('booking_count'), field: 'total_rides', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
      { title: t('vehicle_reg_no'), field: 'driverVehicleNo', cellStyle:{paddingRight: isRTL=== 'rtl'?'10%':null, textAlign:isRTL=== 'rtl'?'right': null}, headerStyle:{paddingRight: isRTL=== 'rtl'?'10%':null,textAlign:isRTL=== 'rtl'?'right': null}},
      { title: t('earning_amount'), field: 'driverShare', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}}
  ];

  const [data, setData] = useState([]);
  const driverearningdata = useSelector(state => state.driverearningdata);

  useEffect(()=>{
        if(driverearningdata.driverearnings){
            setData(driverearningdata.driverearnings);
        }
  },[driverearningdata.driverearnings]);

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    driverearningdata.loading? <CircularLoading/>:
    <MaterialTable
      title={t('driver_earning')}
      columns={columns}
      style={{direction:isRTL ==='rtl'?'rtl':'ltr', borderRadius: "8px", boxShadow: "4px 4px 6px #9E9E9E"}}
      data={data}
      onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
      options={{
        exportButton: true,
        grouping: true,
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
        }
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
