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

// Preview shell, not a replacement HOME launcher. No JavaScript/native bridge.
public class MainActivity extends Activity {
    private WebView web;
    private static final String HOME = "https://4pqqvrsh2t-sudo.github.io/custom-dash/index.html?v=11#cockpit";
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
        web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                Uri uri=request.getUrl();if(!request.isForMainFrame())return false;
                if("https".equals(uri.getScheme())&&"4pqqvrsh2t-sudo.github.io".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/custom-dash/"))return false;
                if("https".equals(uri.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException ignored){}
                return true;
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())Toast.makeText(MainActivity.this,"Dashboard could not load. Check internet and reopen Surface Command.",Toast.LENGTH_LONG).show();}
        });
        web.loadUrl(HOME);
        original.setOnClickListener(v->{try{startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}catch(ActivityNotFoundException e){Toast.makeText(this,"No system home app found.",Toast.LENGTH_LONG).show();}});
        back.setOnClickListener(v->{if(Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},1);else returnButton();});
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
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==1&&results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)returnButton();}
    @Override protected void onPause(){super.onPause();web.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
