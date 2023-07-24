import React,{ useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { api } from 'common';
import { useTranslation } from "react-i18next";
import {colors} from '../components/Theme/WebTheme';

export default function Notifications() {
  const { t, i18n  } = useTranslation();
  const isRTL = i18n.dir();
  const {
    sendNotification,
    editNotifications
  } = api;
  const settings = useSelector(state => state.settingsdata.settings);

  const columns =  [
      {
        title: t('device_type'),
        field: 'devicetype',
        lookup: { All: (t('all')), ANDROID: (t('android')), IOS: (t('ios')) },
        cellStyle:{paddingLeft: isRTL=== 'rtl'?55:null}
      },
      {
        title: t('user_type'),
        field: 'usertype',
        lookup: { customer: t('customer'), driver: t('driver') },
        cellStyle:{paddingLeft: isRTL=== 'rtl'?55:null}
      },
      { title: t('title'),field: 'title', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
      { title: t('body'), field: 'body', cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
  ];

  const [data, setData] = useState([]);
  const notificationdata = useSelector(state => state.notificationdata);
  const dispatch = useDispatch();

  useEffect(()=>{
        if(notificationdata.notifications){
            setData(notificationdata.notifications);
        }else{
            setData([]);
        }
  },[notificationdata.notifications]);

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    notificationdata.loading? <CircularLoading/>:
    <MaterialTable
      title={t('push_notification_title')}
      columns={columns}
      style={{direction:isRTL ==='rtl'?'rtl':'ltr', borderRadius: "8px", boxShadow: "4px 4px 6px #9E9E9E"}}
      data={data}
      onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
      options={{
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
      localization={{body:{
        addTooltip: (t('add')),
        deleteTooltip: (t('delete')),
        editTooltip: (t('edit')),
        emptyDataSourceMessage: (
          (t('blank_message'))
      ),
      editRow: { 
        deleteText: (t('delete_message')),
        cancelTooltip: (t('cancel')),
        saveTooltip: (t('save')) 
        }, 
        },
        toolbar: {
          searchPlaceholder: (t('search')),
          exportTitle: (t('export')),
        },
        header: {
          actions: (t('actions')) 
      },
      pagination: {
        labelDisplayedRows: ('{from}-{to} '+ (t('of'))+ ' {count}'),
        firstTooltip: (t('first_page_tooltip')),
        previousTooltip: (t('previous_page_tooltip')),
        nextTooltip: (t('next_page_tooltip')),
        lastTooltip: (t('last_page_tooltip'))
      },
      }}
      editable={{
        onRowAdd: newData =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if(settings.AllowCriticalEditsAdmin){
                if(newData.body && newData.devicetype && newData.title && newData.usertype){
                  const tblData = data;
                  tblData.push(newData);
                  dispatch(sendNotification(newData));
                  dispatch(editNotifications(newData,"Add"));
                  resolve();
                } else {
                  alert(t('no_details_error'));
                  reject();
                }
              } else{
                alert(t('demo_mode'));
                reject();
              }
            }, 600);
          }),
        onRowDelete: oldData =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              dispatch(editNotifications(oldData,"Delete"));
            }, 600);
          }),
      }}
    />
  );
}
