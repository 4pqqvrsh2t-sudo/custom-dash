package dev.surfacecommand.dash;

import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import android.widget.*;

// Preview shell, not a replacement HOME launcher. The narrow bridge only opens native app surfaces.
public class MainActivity extends Activity {
    private WebView web;
    private PermissionRequest pendingCameraRequest;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;
    private static final int NOTIFICATION_REQUEST=1,CAMERA_REQUEST=2,LOCATION_REQUEST=3;
    private static final String HOME = "https://4pqqvrsh2t-sudo.github.io/custom-dash/index.html?v=19#cockpit";
    private static final String CHANNEL = "cockpit_return";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(8,11,13));
        root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
        LinearLayout controls = new LinearLayout(this);
        Button original = new Button(this); original.setText("ORIGINAL DASH");
        Button back = new Button(this); back.setText("ENABLE RETURN BUTTON");
        controls.addView(original,new LinearLayout.LayoutParams(0,ViewGroup.LayoutParams.WRAP_CONTENT,1));controls.addView(back,new LinearLayout.LayoutParams(0,ViewGroup.LayoutParams.WRAP_CONTENT,1));root.addView(controls);
        web = new WebView(this);root.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
        web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setGeolocationEnabled(true);
        web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new DashboardBridge(),"SurfaceNative");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                Uri uri=request.getUrl();if(!request.isForMainFrame())return false;
                if("https".equals(uri.getScheme())&&"4pqqvrsh2t-sudo.github.io".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/custom-dash/"))return false;
                if("https".equals(uri.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException ignored){}
                return true;
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())Toast.makeText(MainActivity.this,"Dashboard could not load. Check internet and reopen Surface Command.",Toast.LENGTH_LONG).show();}
        });
        web.setWebChromeClient(new WebChromeClient(){
            private boolean trusted(Uri origin){return origin!=null&&"https".equals(origin.getScheme())&&"4pqqvrsh2t-sudo.github.io".equals(origin.getHost());}
            @Override public void onPermissionRequest(PermissionRequest request){runOnUiThread(()->{if(!trusted(request.getOrigin())){request.deny();return;}boolean camera=false;for(String resource:request.getResources())if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource))camera=true;if(!camera){request.deny();return;}if(checkSelfPermission("android.permission.CAMERA")==PackageManager.PERMISSION_GRANTED)request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else{pendingCameraRequest=request;requestPermissions(new String[]{"android.permission.CAMERA"},CAMERA_REQUEST);}});}
            @Override public void onPermissionRequestCanceled(PermissionRequest request){if(pendingCameraRequest==request)pendingCameraRequest=null;}
            @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){Uri uri=Uri.parse(origin);if(!trusted(uri)){callback.invoke(origin,false,false);return;}if(checkSelfPermission("android.permission.ACCESS_FINE_LOCATION")==PackageManager.PERMISSION_GRANTED)callback.invoke(origin,true,false);else{pendingGeoOrigin=origin;pendingGeoCallback=callback;requestPermissions(new String[]{"android.permission.ACCESS_FINE_LOCATION","android.permission.ACCESS_COARSE_LOCATION"},LOCATION_REQUEST);}}
        });
        web.loadUrl(HOME);
        original.setOnClickListener(v->{try{startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}catch(ActivityNotFoundException e){Toast.makeText(this,"No system home app found.",Toast.LENGTH_LONG).show();}});
        back.setOnClickListener(v->{if(Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},NOTIFICATION_REQUEST);else returnButton();});
    }
    private final class DashboardBridge {
        @JavascriptInterface public void openNavigation(){runOnUiThread(()->startActivity(new Intent(MainActivity.this,MapboxNavigationActivity.class)));}
    }
    private void returnButton(){
        NotificationManager manager=getSystemService(NotificationManager.class);
        manager.createNotificationChannel(new NotificationChannel(CHANNEL,"Return to cockpit",NotificationManager.IMPORTANCE_LOW));
        Intent intent=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notification=new Notification.Builder(this,CHANNEL).setSmallIcon(android.R.drawable.ic_menu_compass).setContentTitle("Surface Command").setContentText("Tap to return to your custom cockpit").setContentIntent(pending).setOngoing(true).addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_compass,"RETURN TO COCKPIT",pending).build()).build();
        manager.notify(1,notification);
        Toast.makeText(this,manager.areNotificationsEnabled()?"Return button added to notifications. Check its channel is enabled.":"Notifications are blocked. Reopen Surface Command from the original dash app list.",Toast.LENGTH_LONG).show();
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);boolean granted=results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED;if(code==NOTIFICATION_REQUEST&&granted)returnButton();if(code==CAMERA_REQUEST&&pendingCameraRequest!=null){if(granted)pendingCameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else pendingCameraRequest.deny();pendingCameraRequest=null;}if(code==LOCATION_REQUEST&&pendingGeoCallback!=null){pendingGeoCallback.invoke(pendingGeoOrigin,granted,false);pendingGeoCallback=null;pendingGeoOrigin=null;}}
    @Override protected void onPause(){super.onPause();web.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
