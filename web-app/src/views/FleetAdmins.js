import React,{ useState, useEffect, useRef } from 'react';
import { downloadCsv } from '../common/sharedFunctions';
import MaterialTable from "material-table";
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { api } from 'common';
import { useTranslation } from "react-i18next";
import moment from 'moment/min/moment-with-locales';
import {colors} from '../components/Theme/WebTheme';

export default function Users() {
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  const settings = useSelector(state => state.settingsdata.settings);
  const {
    addUser,
    editUser, 
    deleteUser,
    checkUserExists,
    fetchUsersOnce
  } = api;
  const [data, setData] = useState([]);
  const staticusers = useSelector(state => state.usersdata.staticusers);
  const dispatch = useDispatch();
  const loaded = useRef(false);

  useEffect(()=>{
    dispatch(fetchUsersOnce());
},[dispatch,fetchUsersOnce]);

  useEffect(()=>{
    if(staticusers){
      setData(staticusers.filter(user => user.usertype ==='fleetadmin'));
    }else{
      setData([]);
    }
    loaded.current = true;
  },[staticusers]);

  const columns = [
    { title: t('createdAt'), field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt? moment(rowData.createdAt).format('lll') :null,
        exportTransformer: (rowData) => new Date(rowData.createdAt).toLocaleDateString() + ' '+ new Date(rowData.createdAt).toLocaleTimeString()},
    { title: t('first_name'), field: 'firstName', initialEditValue: '', cellStyle:{ paddingLeft:isRTL ==='rtl'? 50 : 15}},
    { title: t('last_name'), field: 'lastName', initialEditValue: '', cellStyle:{ paddingLeft:isRTL ==='rtl'? 30 : 15}},
    { title: t('mobile'), field: 'mobile', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ?rowData.mobile : "Hidden for Demo"},
    { title: t('email'), field: 'email', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ?rowData.email : "Hidden for Demo",headerStyle:{textAlign:'center'}},
    { title: t('profile_image'),  field: 'profile_image', render: rowData => rowData.profile_image?<img alt='Profile' src={rowData.profile_image} style={{width: 50,borderRadius:'50%'}}/>:null, editable:'never',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
    { title: t('account_approve'),  field: 'approved', type:'boolean', initialEditValue: true, cellStyle:{ textAlign: 'center'}}
  ];

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    !loaded.current? <CircularLoading/>:
    <MaterialTable
      title={t('fleetadmins')}
      columns={columns}
      style={{direction:isRTL ==='rtl'?'rtl':'ltr',  borderRadius: "8px", boxShadow: "4px 4px 6px #9E9E9E"}}
      data={data}
      onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
      options={{
        exportCsv: (columns, data) => {
          let hArray = [];
          const headerRow = columns.map(col => {
            if (typeof col.title === 'object') {
              return col.title.props.text;
            }
            hArray.push(col.field);
            return col.title;
          });
          const dataRows = data.map(({ tableData, ...row }) => {
            row.createdAt = new Date(row.createdAt).toLocaleDateString() + ' '+ new Date(row.createdAt).toLocaleTimeString()
            let dArr = [];
            for(let i=0;i< hArray.length; i++) {
              dArr.push(row[hArray[i]]);
            }
            return Object.values(dArr);
          })
          const { exportDelimiter } = ",";
          const delimiter = exportDelimiter ? exportDelimiter : ",";
          const csvContent = [headerRow, ...dataRows].map(e => e.join(delimiter)).join("\n");
          const csvFileName = 'download.csv';
          downloadCsv(csvContent, csvFileName);
        },
        exportButton: {
          csv: settings.AllowCriticalEditsAdmin,
          pdf: false,
        },
        maxColumnSort: "all_columns",
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
        new Promise((resolve,reject) => {
          setTimeout(() => {
            checkUserExists(newData).then((res) => {
              if (res.users && res.users.length > 0) {
                alert(t('user_exists'));
                reject();
              }
              else if(!(newData && newData.firstName)){
                alert(t('proper_input_name'));
                reject();
              }
              else if(res.error){
                alert(t('email_or_mobile_issue'));
                reject();
              }
              else{
                newData['usertype'] = 'fleetadmin';
                newData['createdAt'] = new Date().getTime();
                delete newData.tableData;
                dispatch(addUser(newData));
                dispatch(fetchUsersOnce());
                resolve();
              }
            });
          }, 600);
        }),
        onRowUpdate: (newData, oldData) =>
          new Promise((resolve,reject) => {
            setTimeout(() => {
              if(!(newData && newData.firstName)){
                alert(t('proper_input_name'));
                reject();
              }else {
                resolve();
                if(newData !== oldData){
                  delete newData.tableData;
                  dispatch(editUser(oldData.id,newData));
                  dispatch(fetchUsersOnce());
                }
              }
            }, 600);
          }),
        onRowDelete: oldData =>
          settings.AllowCriticalEditsAdmin?
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              dispatch(deleteUser(oldData.id));
              dispatch(fetchUsersOnce());
            }, 600);
          })
          :
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              alert(t('demo_mode'));
            }, 600);
          })
          , 
      }}
    />
  );
}
