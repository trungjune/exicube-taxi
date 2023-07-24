import React,{ useState, useEffect, useRef } from 'react';
import { downloadCsv } from '../common/sharedFunctions';
import MaterialTable from "material-table";
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { api } from 'common';
import { useTranslation } from "react-i18next";
import moment from 'moment/min/moment-with-locales';
import { makeStyles } from '@mui/styles';
import {
  Modal,
  Grid,
  Typography
} from '@mui/material';
import {colors} from '../components/Theme/WebTheme';
import Button from "components/CustomButtons/Button.js";
import CancelIcon from '@mui/icons-material/Cancel';
import AlertDialog from '../components/AlertDialog';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';

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
  const [data, setData] = useState([]);
  const [cars, setCars] = useState({});
  const staticusers = useSelector(state => state.usersdata.staticusers);
  const cartypes = useSelector(state => state.cartypes);
  const auth = useSelector(state => state.auth);
  const settings = useSelector(state => state.settingsdata.settings);
  const dispatch = useDispatch();
  const loaded = useRef(false);
  const classes = useStyles();
  const rootRef = useRef(null);
  const [role, setRole] = useState(null);
  const [fleetAdmins,setFleetAdmins] = useState([]);
  const [fleetAdminsObj, setFleetAdminsObj] = useState();

  useEffect(()=>{
      dispatch(fetchUsersOnce());
  },[dispatch,fetchUsersOnce]);

  useEffect(()=>{
    if(staticusers){
        if(role === 'admin'){
          let arr =  staticusers.filter(user => user.usertype==='fleetadmin');
          let obj = {}; 
          let arr2 = [];
          for(let i=0;i  < arr.length; i++){
              let user = arr[i];
              arr2.push({id: user.id, desc:user.firstName + ' ' + user.lastName + ' (' + (settings.AllowCriticalEditsAdmin? user.mobile : "Hidden") + ') ' + (settings.AllowCriticalEditsAdmin? user.email : "Hidden")});
              obj[user.id]=user.firstName + ' ' + user.lastName + ' (' + (settings.AllowCriticalEditsAdmin? user.mobile : "Hidden") + ') ' + (settings.AllowCriticalEditsAdmin? user.email : "Hidden");
          }
          setFleetAdmins(arr2);
          setFleetAdminsObj(obj);
      } 
      setTimeout(()=>{
        setData(staticusers.filter(user => user.usertype ==='driver' && ((user.fleetadmin === auth.profile.uid && auth.profile.usertype === 'fleetadmin')|| auth.profile.usertype === 'admin')));
      },1000);
    }else{
      setData([]);
    }
    loaded.current = true;
  },[staticusers,auth.profile.usertype,auth.profile.uid,settings.AllowCriticalEditsAdmin,role]);

  useEffect(() => {
    if(auth.profile && auth.profile.usertype){
      setRole(auth.profile.usertype);
    }
  }, [auth.profile]);

  useEffect(()=>{
    if(cartypes.cars){
        let obj =  {};
        cartypes.cars.map((car)=> obj[car.name]=car.name)
        setCars(obj);
    }
  },[cartypes.cars]);

  const [imageType, setImageType] = useState(null);

  const onClick = (rowData,text) => {

     if(text === 'licenseImage'){
      setImageType(text);
      setImageData(rowData.licenseImage);
    }
    else if(text === 'licenseImageBack'){
      setImageType(text);
      setImageData(rowData.licenseImageBack);
    }
    else if(text === 'verifyIdImage'){
      setImageType(text);
      setImageData(rowData.verifyIdImage);
    }
    setProfileModal(true);
    setUserData(rowData);
  };

  const columns = [
      { title: t('createdAt'), field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt? moment(rowData.createdAt).format('lll'):null,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('first_name'), field: 'firstName', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('last_name'), field: 'lastName', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('mobile'), field: 'mobile', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ? rowData.mobile : "Hidden for Demo",cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('email'), field: 'email', editable:'onAdd',render: rowData => settings.AllowCriticalEditsAdmin ? rowData.email : "Hidden for Demo",cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'},headerStyle:{textAlign:'center'}},
      { title: t('profile_image'),  field: 'profile_image', render: rowData => rowData.profile_image?<img alt='Profile' src={rowData.profile_image} style={{width: 50,borderRadius:'50%'}}/>:null, editable:'never',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('verify_id'), field: 'verifyId', cellStyle:{textAlign:isRTL=== 'rtl' ?'center':'left'}},
      { title: t('verifyid_image'),  field: 'verifyIdImage', cellStyle:{ textAlign: 'center'},
        render: rowData => rowData.verifyIdImage? <button onClick={()=>{onClick(rowData,'verifyIdImage')}}><img alt='License' src={rowData.verifyIdImage} style={{width: 100}}/></button>:null
      },
      { title: t('fleetadmins'), field: 'fleetadmin', hidden: role === 'admin'? false: true, editable: role === 'admin'? 'always': 'never', cellStyle:{ textAlign: 'center'}, 
      render: rowData => rowData.fleetadmin ? fleetAdminsObj[rowData.fleetadmin]:null,
      editComponent: props => (
        <Autocomplete
          id="combo-box-demo"
          options={fleetAdmins}
          getOptionLabel={(option) => option.desc}
          style={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Combo box" variant="outlined" />}
          onChange={(event, newValue) => {
            props.onChange(newValue.id)
          }}
        />
      )
    },
      { title: t('vehicle_model_name'), field: 'vehicleMake', editable:'never', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('vehicle_model_no'), field: 'vehicleModel', editable:'never', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('vehicle_reg_no'), field: 'vehicleNumber', editable:'never', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('other_info'), field: 'other_info', editable:'never', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('car_type'), field: 'carType', editable:'never', lookup: cars,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('car_approval'), field: 'carApproved', editable:'never', type:'boolean',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('account_approve'),  field: 'approved', type:'boolean', initialEditValue: true,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('driver_active'),  field: 'driverActiveStatus', type:'boolean', initialEditValue: true,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('license_image_front'),  field: 'licenseImage', cellStyle:{ textAlign: 'center'},
        render: rowData => rowData.licenseImage? <button onClick={()=>{onClick(rowData,'licenseImage')}}><img alt='License' src={rowData.licenseImage} style={{width: 100}}/></button>:null
      },
      { title: t('license_image_back'),  field: 'licenseImageBack', cellStyle:{ textAlign: 'center'},
        render: rowData => rowData.licenseImageBack? <button onClick={()=>{onClick(rowData,'licenseImageBack')}}><img alt='License' src={rowData.licenseImageBack} style={{width: 100}}/></button>:null
      },
      { title: t('wallet_balance'),  field: 'walletBalance', type:'numeric' , editable:'never', initialEditValue: 0,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'}},
      { title: t('you_rated_text'), render: rowData => <span>{rowData.rating?rowData.rating: "0"}</span>,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('signup_via_referral'), field: 'signupViaReferral', editable:'never',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('referralId'),  field: 'referralId', editable:'never', initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankName'),  field: 'bankName',  hidden: settings.bank_fields===false? true: false,initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankCode'),  field: 'bankCode', hidden: settings.bank_fields===false? true: false, initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('bankAccount'),  field: 'bankAccount',  hidden: settings.bank_fields===false? true: false,initialEditValue: '',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
      { title: t('queue'),  field: 'queue', type:'boolean', initialEditValue: false,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'center'} },
  ];

  const [profileModal, setProfileModal] =  useState(false);
  const [imageData, setImageData] =  useState(false);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null); 
  const handleProfileModal = (e) => {
    setProfileModal(false);
    setSelectedImage(null);
  }

  const [userData, setUserData] = useState();

  const handleCommonAlertClose = (e) => {
    e.preventDefault();
    setCommonAlert({ open: false, msg: '' })
  };

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

  const [selectedRow, setSelectedRow] = useState(null);

  return (
    !loaded.current? <CircularLoading/>:
    <div style={{backgroundColor:colors.LandingPage_Background}}>
    <MaterialTable
      title={t('drivers')}
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
            row.createdAt = new Date(row.createdAt).toLocaleDateString() + ' '+ new Date(row.createdAt).toLocaleTimeString();
            row.fleetadmin = row.fleetadmin?fleetAdminsObj[row.fleetadmin]:'';
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
              else if(settings && settings.license_image_required && (newData.licenseImage === '' || !newData.licenseImage)){
                alert(t('proper_input_licenseimage'));
                reject();
              }
              else if(settings && settings.license_image_required && (newData.licenseImageBack === '' || !newData.licenseImageBack)){
                alert(t('proper_input_licenseimage'));
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
                newData['usertype'] = 'driver';
                newData['createdAt'] = new Date().getTime();
                const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                const reference = [...Array(5)].map(_ => c[~~(Math.random()*c.length)]).join('');
                newData['referralId'] = reference;
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
              }else if(settings && settings.license_image_required && !(newData && newData.licenseImage)){
                alert(t('proper_input_licenseimage'));
                reject();
              } else if( settings && settings.imageIdApproval && (newData.verifyIdImage === '' || !newData.verifyIdImage)){
                alert(t('upload_id_details'));
                reject();
              }
              else if( settings && settings.imageIdApproval && !newData.verifyId){
                alert(t('upload_id_details'));
                reject();
              }
              else{
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
