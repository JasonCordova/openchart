package com.openchart.directory;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {
    private final HospitalRepository hospitals;

    public HospitalController(HospitalRepository hospitals) { this.hospitals = hospitals; }

    @GetMapping
    public ResponseEntity<List<Hospital>> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(hospitals.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hospital> get(@PathVariable long id) {
        return hospitals.findById(id).map(hospital -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(hospital))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
