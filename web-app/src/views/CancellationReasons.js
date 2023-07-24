import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { api } from 'common';
import { useTranslation } from "react-i18next";
import {colors} from '../components/Theme/WebTheme';

export default function CancellationReasons() {
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  const {
    editCancellationReason
  } = api;

  const columns = [
    { title: t('reason'), field: 'label',render: rowData => <span>{rowData.label}</span>,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'},headerStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}}
  ];
  const settings = useSelector(state => state.settingsdata.settings);
  const [data, setData] = useState([]);
  const cancelreasondata = useSelector(state => state.cancelreasondata);
  const dispatch = useDispatch();

  useEffect(() => {
    if (cancelreasondata.complex) {
      setData(cancelreasondata.complex);
    }else{
      setData([]);
    }
  }, [cancelreasondata.complex]);

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    cancelreasondata.loading ? <CircularLoading /> :
      <MaterialTable
        title={t('cancellation_reasons')}
        columns={columns}
        style={{direction:isRTL ==='rtl'?'rtl':'ltr', borderRadius: "8px", boxShadow: "4px 4px 6px #9E9E9E"}}
        data={data}
        onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
        options={{
          exportButton: true,
          pageSize: 10,
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
          pagination: {
            labelDisplayedRows: ('{from}-{to} '+ (t('of'))+ ' {count}'),
            firstTooltip: (t('first_page_tooltip')),
            previousTooltip: (t('previous_page_tooltip')),
            nextTooltip: (t('next_page_tooltip')),
            lastTooltip: (t('last_page_tooltip'))
          },
        }}
        editable={settings.AllowCriticalEditsAdmin ? {
            onRowAdd: newData =>
            new Promise((resolve, reject)=> {
              setTimeout(() => {
                const tblData = data;
                newData.value = tblData.length;
                if(!(newData && newData.label)){
                  alert(t('no_details_error'));
                  reject();
                }else{
                  tblData.push(newData);
                  dispatch(editCancellationReason(tblData, "Add"));
                  resolve();
                }
              }, 600);
            }),
          onRowUpdate: (newData, oldData) =>
            new Promise((resolve, reject)=> {
              setTimeout(() => {
                if(!(newData && newData.label )){
                  alert(t('no_details_error'));
                  reject();
                }else {
                  resolve();
                  if(newData !== oldData){
                    const tblData = data;
                    tblData[tblData.indexOf(oldData)] = newData;
                    dispatch(editCancellationReason(tblData, "Update"));
                  }
                }
              }, 600);
            }),
          onRowDelete: oldData =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve();
                const tblData = data;
                const newTtblData = tblData.filter((item) => item.value !== oldData.value);
                dispatch(editCancellationReason(newTtblData, "Delete"));
              }, 600);
            }),
        } : null}
      />
  );
}
