  import React,{ useState, useEffect, useRef } from 'react';
  import { downloadCsv } from '../common/sharedFunctions';
  import MaterialTable from "material-table";
  import { useSelector, useDispatch } from "react-redux";
  import CircularLoading from "../components/CircularLoading";
  import { api } from 'common';
  import { useTranslation } from "react-i18next";
  import moment from 'moment/min/moment-with-locales';
  import {colors} from '../components/Theme/WebTheme';
  import {
    Modal,
    Grid,
    Typography
  } from '@mui/material';
import Button from "components/CustomButtons/Button.js";
import CancelIcon from '@mui/icons-material/Cancel';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from '@mui/styles';
import AlertDialog from '../components/AlertDialog';

const useStyles = makeStyles((theme) => ({
  heading:{
   marginBottom:20,
  height:'10%'
  },
  submit1: {
    marginLeft:30 
  },
  submit: {
    backgroundColor:'#de7d1e',
  },
  submit5: {
    backgroundColor:'#0c5c6b',
  },
  submit3:{
    width:'100%',
    borderRadius:3,
    marginTop:2,
    padding:4
  },
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 500,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    borderRadius:15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit4:{
    backgroundColor:'red',
    width:'100%',
    borderRadius:3,
    marginTop:2,
    padding:4
  }
}));

  export default function Users() {
    const { t,i18n } = useTranslation();
    const isRTL = i18n.dir();
    const {
      addUser,
      editUser, 
      deleteUser,
      checkUserExists,
      fetchUsersOnce,
      updateLicenseImage
    } = api;
    const settings = useSelector(state => state.settingsdata.settings);
    const [data, setData] = useState([]);
    const staticusers = useSelector(state => state.usersdata.staticusers);
    const auth = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const loaded = useRef(false);
    const classes = useStyles();
    const rootRef = useRef(null);

    useEffect(()=>{
      dispatch(fetchUsersOnce());
    },[dispatch,fetchUsersOnce]);
    
    useEffect(()=>{
      if(staticusers){
        setData(staticusers.filter(user => user.usertype ==='customer' && ((user.fleetadmin === auth.profile.uid && auth.profile.usertype === 'fleetadmin')|| auth.profile.usertype === 'admin')));
      }else{
        setData([]);
      }
      loaded.current = true;
    },[staticusers,auth.profile]);

    const columns = [
      { title: t('createdAt'), field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt? moment(rowData.createdAt).format('lll'):null,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
      { title: t('first_name'), field: 'firstName',cellStyle:{textAlign:isRTL=== 'rtl' ?'center':'left'}},
      { title: t('last_name'), field: 'lastName',cellStyle:{textAlign:isRTL=== 'rtl' ?'center':'left'}},
      { title: t('mobile'), field: 'mobile', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ? rowData.mobile : "Hidden for Demo",cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('email'), field: 'email', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ? rowData.email : "Hidden for Demo",cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'},headerStyle:{textAlign:'center'}},
      { title: t('profile_image'),  field: 'profile_image', render: rowData => rowData.profile_image?<img alt='Profile' src={rowData.profile_image} style={{width: 50,borderRadius:'50%'}}/>:null, editable:'never',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
      { title: t('verify_id'), field: 'verifyId', cellStyle:{textAlign:isRTL=== 'rtl' ?'center':'left'}},
      { title: t('verifyid_image'),  field: 'verifyIdImage', cellStyle:{ textAlign: 'center'},
        render: rowData => rowData.verifyIdImage? <button onClick={()=>{onClick(rowData,'verifyIdImage')}}><img alt='License' src={rowData.verifyIdImage} style={{width: 100}}/></button>:null
      },
      { title: t('account_approve'),  field: 'approved', type:'boolean',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
      { title: t('wallet_balance'),  field: 'walletBalance', type:'numeric' , editable:'never', initialEditValue: 0,cellStyle:{textAlign:isRTL=== 'rtl' ?'center':'center'}},
      { title: t('signup_via_referral'), field: 'signupViaReferral', editable:'never' ,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
      { title: t('referralId'),  field: 'referralId', editable:'never', initialEditValue: '' ,cellStyle:{textAlign:isRTL=== 'rtl' ?'center':'left'}},
      { title: t('bankName'),  field: 'bankName',  hidden: settings.bank_fields===false? true: false,initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankCode'),  field: 'bankCode', hidden: settings.bank_fields===false? true: false, initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankAccount'),  field: 'bankAccount',  hidden: settings.bank_fields===false? true: false,initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
    ];

    const [profileModal, setProfileModal] =  useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [imageData, setImageData] =  useState(false);
    const [selectedImage, setSelectedImage] = useState(null); 
    const [imageType, setImageType] = useState(null);
    const [userData, setUserData] = useState();
    const [loading, setLoading] = useState(false);
    const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });


  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

    const onClick = (rowData,text) => {
      if(text === 'verifyIdImage'){
       setImageType(text);
       setImageData(rowData.verifyIdImage);
     }
     setProfileModal(true);
     setUserData(rowData);
   };

   const handleProfileModal = (e) => {
    setProfileModal(false);
    setSelectedImage(null);
  }

   const handleSetProfileModal = (e) =>{
    e.preventDefault();
    if(selectedImage){
      setLoading(true);
      dispatch(updateLicenseImage(userData.id, selectedImage, imageType));
      setProfileModal(false); 
      setSelectedImage(null);
      setTimeout(()=>{
        setLoading(false); 
        dispatch(fetchUsersOnce());
      },10000);
    }
    else{
      setCommonAlert({ open: true, msg: t('choose_image_first') })
    }
  }

    return (
      !loaded.current? <CircularLoading/>:
      <div>
        <MaterialTable
          title={t('riders')}
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
          localization={{ body:{
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
                    else if( settings && settings.imageIdApproval && (newData.verifyIdImage === '' || !newData.verifyIdImage)){
                      alert(t('upload_id_details'));
                      reject();
                    }
                    else if( settings && settings.imageIdApproval && !newData.verifyId){
                      alert(t('upload_id_details'));
                      reject();
                    }
                    else{
                      newData['usertype'] = 'customer';
                      newData['createdAt'] = new Date().getTime();
                      const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                      const reference = [...Array(5)].map(_ => c[~~(Math.random()*c.length)]).join('');
                      newData['referralId'] = reference;
                      delete newData.tableData;
                      let role = auth.profile.usertype;
                      if(role === 'fleetadmin'){
                        newData['fleetadmin'] = auth.profile.uid; 
                      }
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
                  } else if( settings && settings.imageIdApproval && (newData.verifyIdImage === '' || !newData.verifyIdImage)){
                    alert(t('upload_id_details'));
                    reject();
                  }
                  else if( settings && settings.imageIdApproval && !newData.verifyId){
                    alert(t('upload_id_details'));
                    reject();
                  }
                  else {
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

        <Modal
          disablePortal
          disableEnforceFocus
          disableAutoFocus
          open={profileModal}
          onClose={handleProfileModal}
          className={classes.modal}
          container={() => rootRef.current}
        >
          <Grid container spacing={1} className={classes.paper} style={{direction:isRTL==='rtl'?'rtl':'ltr'}}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Typography component="h1" variant="h6">
                        {t('license_image')}
                        <input
                            type="file"
                            style={{marginLeft:10}}
                            name= {t('image')}
                            onChange={(event) => {
                                setSelectedImage(event.target.files[0]);
                            }}
                        />
                  </Typography>
                </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    {selectedImage  && !loading ? 
                      <Tooltip title={t('cancel')}>
                        <CancelIcon onClick={()=>setSelectedImage(null)} style={{ fontSize: 30,backgroundColor:'red',borderRadius:50,color:"white" }}  />
                      </Tooltip>
                    : null }
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                      {selectedImage ? 
                        <img alt="not fount" height={"200px"} src={URL.createObjectURL(selectedImage)} style={{marginTop:15,marginBottom:20}}/>
                      :
                        <img alt="licimage" height={"200px"} src={imageData} style={{marginTop:10}}/>
                      }
                      <br />
                    </Grid>
                  
            <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
              {loading ? 
              <Grid
                container
                spacing={0}
                alignItems="center"
                justify="center"
                style={{ minHeight: '5vh' }} >
                <CircularProgress/>
              </Grid>
              :
              <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
              <Button onClick={handleProfileModal} variant="contained" color="danger">
              {t('cancel')}
            </Button> 
              <Button onClick={handleSetProfileModal} variant="contained" color="secondaryButton" style={{marginLeft:10}}>
                {t('save')}
              </Button>
              </Grid>
              }
            </Grid>
          </Grid>
        </Modal>
        <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
      </div>
    );
  }
