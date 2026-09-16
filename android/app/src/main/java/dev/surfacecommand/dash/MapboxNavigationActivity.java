package dev.surfacecommand.dash;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.mapbox.geojson.Point;
import com.mapbox.maps.CameraOptions;
import com.mapbox.maps.MapView;
import com.mapbox.maps.Style;

/** Real Mapbox map surface. Route search/guidance and matched posted-limit delivery are the next native layer. */
public final class MapboxNavigationActivity extends Activity {
    private static final int LOCATION_REQUEST = 50;
    private MapView mapView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (getString(R.string.mapbox_access_token).isEmpty()) {
            Toast.makeText(this,"Mapbox public token was not injected at build time.",Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        FrameLayout root=new FrameLayout(this);
        mapView=new MapView(this);
        mapView.getMapboxMap().setCamera(new CameraOptions.Builder().center(Point.fromLngLat(-81.9320,34.9496)).zoom(13.0).build());
        mapView.getMapboxMap().loadStyleUri(Style.DARK);
        root.addView(mapView,new FrameLayout.LayoutParams(-1,-1));

        LinearLayout top=new LinearLayout(this);top.setGravity(Gravity.CENTER_VERTICAL);top.setPadding(16,10,16,10);top.setBackgroundColor(Color.argb(225,8,11,13));
        Button close=new Button(this);close.setText("BACK TO COCKPIT");close.setOnClickListener(v->finish());
        TextView stateLabel=new TextView(this);stateLabel.setText("  MAPBOX / LIVE MAP");stateLabel.setTextColor(Color.rgb(255,171,84));stateLabel.setTextSize(12);
        top.addView(close);top.addView(stateLabel,new LinearLayout.LayoutParams(0,ViewGroup.LayoutParams.WRAP_CONTENT,1));
        FrameLayout.LayoutParams topParams=new FrameLayout.LayoutParams(-1,ViewGroup.LayoutParams.WRAP_CONTENT,Gravity.TOP);root.addView(top,topParams);

        TextView status=new TextView(this);status.setText("POSTED LIMIT  —   •   GPS MATCH REQUIRED\nMAP DATA IS LIVE; GUIDANCE IS NOT ACTIVE");status.setTextColor(Color.rgb(147,239,255));status.setTextSize(12);status.setGravity(Gravity.CENTER);status.setPadding(12,12,12,12);status.setBackgroundColor(Color.argb(225,8,11,13));
        FrameLayout.LayoutParams bottom=new FrameLayout.LayoutParams(-1,ViewGroup.LayoutParams.WRAP_CONTENT,Gravity.BOTTOM);root.addView(status,bottom);
        setContentView(root);
        if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},LOCATION_REQUEST);
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==LOCATION_REQUEST&&(results.length==0||results[0]!=PackageManager.PERMISSION_GRANTED))Toast.makeText(this,"Location denied. The map remains usable, but vehicle position is unavailable.",Toast.LENGTH_LONG).show();}
    @Override protected void onDestroy(){mapView=null;super.onDestroy();}
}
